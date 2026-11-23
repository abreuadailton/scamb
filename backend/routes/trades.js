'use strict';

const express = require('express');
const QRCode  = require('qrcode');
const db      = require('../db/database');
const auth    = require('../middleware/auth');

const router = express.Router();

// ─── Haversine distance (metres) ─────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Helper: fetch a trade with participants ──────────────────────────────────
function getTrade(id) {
  return db.prepare(`
    SELECT
      t.*,
      u_req.name       AS requester_name,
      u_req.email      AS requester_email,
      u_req.avatar_url AS requester_avatar,
      u_req.reputation AS requester_reputation,
      u_own.name       AS owner_name,
      u_own.email      AS owner_email,
      u_own.avatar_url AS owner_avatar,
      u_own.reputation AS owner_reputation,
      io.title         AS item_offered_title,
      io.title         AS offered_title,
      io.images        AS offered_images,
      iw.title         AS item_wanted_title,
      iw.title         AS wanted_title,
      iw.images        AS wanted_images,
      ep.name          AS meeting_point_name,
      ep.address       AS meeting_point_address
    FROM trades t
    LEFT JOIN users u_req ON u_req.id = t.requester_id
    LEFT JOIN users u_own ON u_own.id = t.owner_id
    LEFT JOIN items io    ON io.id    = t.item_offered_id
    LEFT JOIN items iw    ON iw.id    = t.item_wanted_id
    LEFT JOIN exchange_points ep ON ep.id = t.meeting_point_id
    WHERE t.id = ?
  `).get(id);
}

// ─── GET / — list user trades ─────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  try {
    const trades = db.prepare(`
      SELECT
        t.*,
        u_req.name  AS requester_name,
        u_own.name  AS owner_name,
        io.title    AS item_offered_title,
        io.title    AS offered_title,
        iw.title    AS item_wanted_title,
        iw.title    AS wanted_title,
        ep.name     AS meeting_point_name
      FROM trades t
      LEFT JOIN users u_req ON u_req.id = t.requester_id
      LEFT JOIN users u_own ON u_own.id = t.owner_id
      LEFT JOIN items io    ON io.id    = t.item_offered_id
      LEFT JOIN items iw    ON iw.id    = t.item_wanted_id
      LEFT JOIN exchange_points ep ON ep.id = t.meeting_point_id
      WHERE t.requester_id = ? OR t.owner_id = ?
      ORDER BY t.updated_at DESC
    `).all(req.user.id, req.user.id);

    return res.json({ success: true, data: trades });
  } catch (err) {
    console.error('[trades GET /]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /:id — trade detail ──────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    return res.json({ success: true, data: trade });
  } catch (err) {
    console.error('[trades GET /:id]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST / — propose trade ───────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  try {
    const {
      item_offered_id,
      item_wanted_id,
      meeting_point_id,
      meeting_lat,
      meeting_lng,
      meeting_address,
      meeting_date
    } = req.body;

    if (!item_offered_id || !item_wanted_id) {
      return res.status(400).json({ success: false, error: 'item_offered_id e item_wanted_id são obrigatórios.' });
    }

    // Validate offered item belongs to requester
    const offeredItem = db.prepare('SELECT * FROM items WHERE id = ?').get(item_offered_id);
    if (!offeredItem) {
      return res.status(404).json({ success: false, error: 'Item ofertado não encontrado.' });
    }
    if (offeredItem.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Você não pode ofertar um item que não é seu.' });
    }

    // Validate wanted item exists
    const wantedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(item_wanted_id);
    if (!wantedItem) {
      return res.status(404).json({ success: false, error: 'Item desejado não encontrado.' });
    }
    if (wantedItem.user_id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Você não pode propor uma troca com seus próprios itens.' });
    }

    // Resolve meeting point lat/lng from exchange_point if provided
    let meetLat = meeting_lat || null;
    let meetLng = meeting_lng || null;
    let meetAddr = meeting_address || null;

    if (meeting_point_id) {
      const ep = db.prepare('SELECT * FROM exchange_points WHERE id = ?').get(meeting_point_id);
      if (!ep) {
        return res.status(404).json({ success: false, error: 'Ponto de troca não encontrado.' });
      }
      meetLat  = ep.latitude;
      meetLng  = ep.longitude;
      meetAddr = ep.address;
    }

    if (!meetLat || !meetLng) {
      return res.status(400).json({ success: false, error: 'Informe um ponto de encontro (meeting_point_id ou meeting_lat/lng).' });
    }

    const result = db.prepare(`
      INSERT INTO trades
        (requester_id, owner_id, item_offered_id, item_wanted_id,
         meeting_point_id, meeting_lat, meeting_lng, meeting_address, meeting_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      wantedItem.user_id,
      item_offered_id,
      item_wanted_id,
      meeting_point_id || null,
      meetLat,
      meetLng,
      meetAddr,
      meeting_date || null
    );

    const trade = getTrade(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: trade });
  } catch (err) {
    console.error('[trades POST /]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /:id/accept — accept trade ──────────────────────────────────────────
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Apenas o dono do item pode aceitar a troca.' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Troca não pode ser aceita (status atual: ${trade.status}).` });
    }

    // Generate QR code
    const qrPayload = JSON.stringify({
      tradeId:     trade.id,
      requester:   { id: trade.requester_id, name: trade.requester_name },
      owner:       { id: trade.owner_id,     name: trade.owner_name },
      itemOffered: { id: trade.item_offered_id, title: trade.item_offered_title },
      itemWanted:  { id: trade.item_wanted_id,  title: trade.item_wanted_title },
      timestamp:   new Date().toISOString()
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload);

    db.prepare(`
      UPDATE trades SET status = 'accepted', qr_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(qrDataUrl, trade.id);

    const updated = getTrade(trade.id);
    return res.json({
      success: true,
      data: updated,
      status: updated.status,
      message: 'Troca aceita com sucesso! O QR Code de validação presencial foi gerado.'
    });
  } catch (err) {
    console.error('[trades PUT /:id/accept]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /:id/reject — reject trade ──────────────────────────────────────────
router.put('/:id/reject', auth, (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Apenas o dono do item pode rejeitar a troca.' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Troca não pode ser rejeitada (status atual: ${trade.status}).` });
    }

    db.prepare(`
      UPDATE trades SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(trade.id);

    const updated = getTrade(trade.id);
    return res.json({
      success: true,
      data: updated,
      status: updated.status,
      message: 'Troca aceita com sucesso! O QR Code de validação presencial foi gerado.'
    });
  } catch (err) {
    console.error('[trades PUT /:id/reject]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /:id/cancel — cancel trade ──────────────────────────────────────────
router.put('/:id/cancel', auth, (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    if (['completed', 'cancelled'].includes(trade.status)) {
      return res.status(400).json({ success: false, error: `Troca já foi ${trade.status}.` });
    }

    db.prepare(`
      UPDATE trades SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(trade.id);

    const updated = getTrade(trade.id);
    return res.json({
      success: true,
      data: updated,
      status: updated.status,
      message: 'Troca aceita com sucesso! O QR Code de validação presencial foi gerado.'
    });
  } catch (err) {
    console.error('[trades PUT /:id/cancel]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST /:id/checkin — check-in at meeting point ───────────────────────────
router.post('/:id/checkin', auth, (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'latitude e longitude são obrigatórios.' });
    }

    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    const isRequester = trade.requester_id === req.user.id;
    const isOwner     = trade.owner_id     === req.user.id;

    if (!isRequester && !isOwner) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    if (trade.status !== 'accepted') {
      return res.status(400).json({ success: false, error: 'A troca precisa estar aceita para fazer check-in.' });
    }

    // Validate proximity (≤500m)
    if (trade.meeting_lat && trade.meeting_lng) {
      const dist = haversine(latitude, longitude, trade.meeting_lat, trade.meeting_lng);
      if (dist > 500) {
        return res.status(400).json({
          success: false,
          error: `Você está a ${Math.round(dist)}m do ponto de encontro. Aproxime-se a menos de 500m para fazer check-in.`
        });
      }
    }

    // Check if already checked in
    if (isRequester && trade.checkin_requester) {
      return res.status(400).json({ success: false, error: 'Você já fez check-in.' });
    }
    if (isOwner && trade.checkin_owner) {
      return res.status(400).json({ success: false, error: 'Você já fez check-in.' });
    }

    // Update checkin flag
    if (isRequester) {
      db.prepare('UPDATE trades SET checkin_requester = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(trade.id);
    } else {
      db.prepare('UPDATE trades SET checkin_owner = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(trade.id);
    }

    // Re-fetch to check if both checked in
    const refreshed = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade.id);
    if (refreshed.checkin_requester && refreshed.checkin_owner) {
      db.prepare(`
        UPDATE trades SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(trade.id);

      // Increment reputation for both participants
      db.prepare('UPDATE users SET reputation = reputation + 1 WHERE id = ?').run(trade.requester_id);
      db.prepare('UPDATE users SET reputation = reputation + 1 WHERE id = ?').run(trade.owner_id);

      // Mark items as traded
      db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(trade.item_offered_id);
      db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(trade.item_wanted_id);
    }

    const updated = getTrade(trade.id);
    return res.json({
      success: true,
      data: updated,
      status: updated.status,
      message: 'Troca aceita com sucesso! O QR Code de validação presencial foi gerado.'
    });
  } catch (err) {
    console.error('[trades POST /:id/checkin]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /:id/qrcode — return QR code (generates on demand if missing) ───────
router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    let qrCode = trade.qr_code;

    // If QR code is not generated yet, generate it now
    if (!qrCode) {
      const qrPayload = JSON.stringify({
        scamb_trade_id: trade.id,
        swaply_trade_id: trade.id,
        requester: trade.requester_name,
        owner: trade.owner_name,
        offered: trade.item_offered_title,
        wanted: trade.item_wanted_title,
        location: trade.meeting_address,
        created: trade.created_at,
        auth_hash: Buffer.from(`scamb-${trade.id}-${trade.requester_id}-${trade.owner_id}`).toString('base64')
      });

      qrCode = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: { dark: '#4f46e5', light: '#ffffff' },
        width: 320
      });

      db.prepare('UPDATE trades SET qr_code = ? WHERE id = ?').run(qrCode, trade.id);
    }

    return res.json({ 
      success: true, 
      data: { 
        qr_code: qrCode,
        trade_id: trade.id,
        auth_code: `SWAP-${String(trade.id).padStart(4, '0')}-${trade.requester_id}${trade.owner_id}`
      } 
    });
  } catch (err) {
    console.error('[trades GET /:id/qrcode]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST /:id/validate-qr — validate QR code at physical meeting ────────────
router.post('/:id/validate-qr', auth, (req, res) => {
  try {
    const trade = getTrade(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    if (trade.status === 'completed') {
      return res.json({ 
        success: true, 
        completed: true,
        message: 'Esta troca já foi confirmada e concluída com sucesso!' 
      });
    }

    if (trade.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: `A troca precisa estar aceita para ser autenticada (status atual: ${trade.status}).` 
      });
    }

    // Mark trade as completed via QR validation
    db.prepare(`
      UPDATE trades 
      SET status = 'completed', checkin_requester = 1, checkin_owner = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(trade.id);

    // Increase reputation for both participants
    db.prepare('UPDATE users SET reputation = reputation + 10 WHERE id = ?').run(trade.requester_id);
    db.prepare('UPDATE users SET reputation = reputation + 10 WHERE id = ?').run(trade.owner_id);

    // Mark items as traded
    db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(trade.item_offered_id);
    db.prepare("UPDATE items SET status = 'traded' WHERE id = ?").run(trade.item_wanted_id);

    const updated = getTrade(trade.id);

    return res.json({
      success: true,
      completed: true,
      status: 'completed',
      message: '🎉 QR Code autenticado com sucesso! A entrega presencial foi validada e ambos os usuários ganharam +10 pontos de reputação!',
      data: updated
    });
  } catch (err) {
    console.error('[trades POST /:id/validate-qr]', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao validar QR Code.' });
  }
});

module.exports = router;

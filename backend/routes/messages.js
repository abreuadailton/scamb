'use strict';

const express = require('express');
const db      = require('../db/database');
const auth    = require('../middleware/auth');

const router = express.Router();

// ─── GET /trade/:tradeId — list messages for a trade ─────────────────────────
router.get('/trade/:tradeId', auth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.tradeId);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado. Você não participa desta troca.' });
    }

    const messages = db.prepare(`
      SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.trade_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.tradeId);

    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error('[messages GET /trade/:tradeId]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST /trade/:tradeId — send a message ────────────────────────────────────
router.post('/trade/:tradeId', auth, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'O conteúdo da mensagem não pode estar vazio.' });
    }

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.tradeId);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troca não encontrada.' });
    }

    if (trade.requester_id !== req.user.id && trade.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado. Você não participa desta troca.' });
    }

    if (['completed', 'cancelled', 'rejected'].includes(trade.status)) {
      return res.status(400).json({ success: false, error: 'Não é possível enviar mensagens em trocas finalizadas.' });
    }

    const result = db.prepare(`
      INSERT INTO messages (trade_id, sender_id, content) VALUES (?, ?, ?)
    `).run(req.params.tradeId, req.user.id, content.trim());

    const message = db.prepare(`
      SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('[messages POST /trade/:tradeId]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST /inquiry — start or retrieve a conversation for an item ────────────
router.post('/inquiry', auth, (req, res) => {
  try {
    const { item_id, message } = req.body;
    if (!item_id) {
      return res.status(400).json({ success: false, error: 'item_id é obrigatório.' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item não encontrado.' });
    }

    if (item.user_id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Você não pode iniciar conversa sobre seu próprio item.' });
    }

    // Check if an existing open trade exists between these two users for this item
    let trade = db.prepare(`
      SELECT * FROM trades 
      WHERE item_wanted_id = ? AND requester_id = ? AND status IN ('pending', 'accepted')
      ORDER BY id DESC LIMIT 1
    `).get(item.id, req.user.id);

    if (!trade) {
      // Find one item of requester to link as offered item (or first available)
      let myItem = db.prepare('SELECT id FROM items WHERE user_id = ? AND status = ? LIMIT 1').get(req.user.id, 'available');
      if (!myItem) {
        myItem = db.prepare('SELECT id FROM items WHERE user_id = ? LIMIT 1').get(req.user.id);
      }
      const offeredId = myItem ? myItem.id : null;

      // Default meeting point
      const ep = db.prepare('SELECT * FROM exchange_points LIMIT 1').get();

      const result = db.prepare(`
        INSERT INTO trades (
          requester_id, owner_id, item_offered_id, item_wanted_id,
          status, meeting_point_id, meeting_lat, meeting_lng, meeting_address, meeting_date
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now', '+3 days'))
      `).run(
        req.user.id,
        item.user_id,
        offeredId,
        item.id,
        ep ? ep.id : null,
        ep ? ep.latitude : null,
        ep ? ep.longitude : null,
        ep ? ep.address : 'A combinar no chat'
      );

      trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
    }

    if (message && message.trim()) {
      db.prepare(`
        INSERT INTO messages (trade_id, sender_id, content) VALUES (?, ?, ?)
      `).run(trade.id, req.user.id, message.trim());
    }

    return res.json({ success: true, trade_id: trade.id });
  } catch (err) {
    console.error('[messages POST /inquiry]', err);
    return res.status(500).json({ success: false, error: 'Erro ao iniciar conversa.' });
  }
});

module.exports = router;

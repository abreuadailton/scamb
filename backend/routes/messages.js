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

module.exports = router;

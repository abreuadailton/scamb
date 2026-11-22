'use strict';

const express = require('express');
const db      = require('../db/database');

const router = express.Router();

// ─── GET / — list all exchange points ────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const points = db.prepare('SELECT * FROM exchange_points ORDER BY name ASC').all();
    return res.json({ success: true, data: points });
  } catch (err) {
    console.error('[exchange-points GET /]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /:id — exchange point detail ────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const point = db.prepare('SELECT * FROM exchange_points WHERE id = ?').get(req.params.id);

    if (!point) {
      return res.status(404).json({ success: false, error: 'Ponto de troca não encontrado.' });
    }

    return res.json({ success: true, data: point });
  } catch (err) {
    console.error('[exchange-points GET /:id]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

module.exports = router;

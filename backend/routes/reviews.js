'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// ─── GET /api/reviews/user/:userId — List reviews for a specific user ─────────
router.get('/user/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'ID de usuário inválido.' });
    }

    const reviews = db.prepare(`
      SELECT 
        r.id,
        r.trade_id,
        r.rater_id,
        r.rated_id,
        r.score,
        r.comment,
        r.created_at,
        u.name AS rater_name,
        u.avatar_url AS rater_avatar
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    const count = reviews.length;
    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const rev of reviews) {
      sum += Number(rev.score) || 5;
      const s = Math.min(Math.max(Math.round(rev.score), 1), 5);
      distribution[s] = (distribution[s] || 0) + 1;
    }

    const average = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;

    return res.json({
      success: true,
      count,
      average,
      distribution,
      reviews
    });
  } catch (err) {
    console.error('[reviews GET /user/:userId]', err);
    return res.status(500).json({ success: false, error: 'Erro ao carregar avaliações.' });
  }
});

// ─── POST /api/reviews — Submit a new review ───────────────────────────────────
router.post('/', auth, (req, res) => {
  try {
    const { rated_id, score, comment, trade_id } = req.body;

    const ratedId = Number(rated_id);
    const numScore = Number(score);

    if (!ratedId || !numScore || !comment) {
      return res.status(400).json({ 
        success: false, 
        error: 'rated_id, score (1-5) e comment são obrigatórios.' 
      });
    }

    if (numScore < 1 || numScore > 5) {
      return res.status(400).json({ success: false, error: 'Nota deve ser entre 1 e 5 estrelas.' });
    }

    if (ratedId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Você não pode avaliar a si mesmo.' });
    }

    // Verify rated user exists
    const targetUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(ratedId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const stmt = db.prepare(`
      INSERT INTO ratings (trade_id, rater_id, rated_id, score, comment, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(trade_id || null, req.user.id, ratedId, numScore, comment.trim());

    // Update reputation score of user (+5 to +10 pts)
    const bonus = numScore >= 4 ? 10 : 5;
    db.prepare('UPDATE users SET reputation = reputation + ? WHERE id = ?').run(bonus, ratedId);

    const saved = db.prepare(`
      SELECT 
        r.id, r.trade_id, r.rater_id, r.rated_id, r.score, r.comment, r.created_at,
        u.name AS rater_name, u.avatar_url AS rater_avatar
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Avaliação registrada com sucesso!',
      data: saved
    });
  } catch (err) {
    console.error('[reviews POST /]', err);
    return res.status(500).json({ success: false, error: 'Erro ao registrar avaliação.' });
  }
});

module.exports = router;

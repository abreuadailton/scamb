'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db/database');
const auth    = require('../middleware/auth');

const router = express.Router();

const itemStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'frontend', 'img', 'items');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `item-${Date.now()}-${Math.round(Math.random()*1E5)}${ext}`);
  }
});
const uploadItem = multer({ storage: itemStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── POST /upload — upload item photos ────────────────────────────────────────
router.post('/upload', auth, uploadItem.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }
    const urls = req.files.map(f => `img/items/${f.filename}`);
    return res.json({ success: true, urls });
  } catch(err) {
    console.error('[items upload]', err);
    return res.status(500).json({ success: false, error: 'Erro no upload das imagens.' });
  }
});

// ─── GET / — list available items ────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT i.*, u.name AS owner_name, u.reputation AS owner_reputation, u.avatar_url AS owner_avatar
      FROM items i
      JOIN users u ON u.id = i.user_id
      WHERE i.status = 'available'
      ORDER BY i.created_at DESC
    `).all();

    // Parse images JSON for each item
    const parsed = items.map(item => ({
      ...item,
      images: parseImages(item.images)
    }));

    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[items GET /]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /user/my — authenticated user's items ───────────────────────────────
// IMPORTANT: this route must come BEFORE /:id to avoid being shadowed
router.get('/user/my', auth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT i.*, u.name AS owner_name, u.reputation AS owner_reputation
      FROM items i
      JOIN users u ON u.id = i.user_id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      data: items.map(item => ({ ...item, images: parseImages(item.images) }))
    });
  } catch (err) {
    console.error('[items GET /user/my]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /:id — item detail ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare(`
      SELECT i.*, u.name AS owner_name, u.reputation AS owner_reputation, u.bio AS owner_bio, u.avatar_url AS owner_avatar
      FROM items i
      JOIN users u ON u.id = i.user_id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item não encontrado.' });
    }

    return res.json({ success: true, data: { ...item, images: parseImages(item.images) } });
  } catch (err) {
    console.error('[items GET /:id]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST / — create item ─────────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  try {
    const { title, description, category, condition, images, latitude, longitude, location_name } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'O campo title é obrigatório.' });
    }

    const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

    const result = db.prepare(`
      INSERT INTO items (user_id, title, description, category, condition, images, latitude, longitude, location_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, description || null, category || null, condition || null, imagesJson, latitude || null, longitude || null, location_name || null);

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: { ...item, images: parseImages(item.images) } });
  } catch (err) {
    console.error('[items POST /]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /:id — update item ───────────────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item não encontrado.' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado. Você não é o dono deste item.' });
    }

    const { title, description, category, condition, images, latitude, longitude, location_name, status } = req.body;

    const updatedImages = images !== undefined
      ? JSON.stringify(Array.isArray(images) ? images : [])
      : item.images;

    db.prepare(`
      UPDATE items
      SET title = ?, description = ?, category = ?, condition = ?, images = ?,
          latitude = ?, longitude = ?, location_name = ?, status = ?
      WHERE id = ?
    `).run(
      title        || item.title,
      description  !== undefined ? description  : item.description,
      category     !== undefined ? category     : item.category,
      condition    !== undefined ? condition    : item.condition,
      updatedImages,
      latitude     !== undefined ? latitude     : item.latitude,
      longitude    !== undefined ? longitude    : item.longitude,
      location_name !== undefined ? location_name : item.location_name,
      status       || item.status,
      item.id
    );

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(item.id);
    return res.json({ success: true, data: { ...updated, images: parseImages(updated.images) } });
  } catch (err) {
    console.error('[items PUT /:id]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── DELETE /:id — delete item ────────────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item não encontrado.' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado. Você não é o dono deste item.' });
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(item.id);
    return res.json({ success: true, data: { message: 'Item deletado com sucesso.' } });
  } catch (err) {
    console.error('[items DELETE /:id]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseImages(raw) {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

module.exports = router;

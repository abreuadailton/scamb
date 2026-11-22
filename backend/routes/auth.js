'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const auth    = require('../middleware/auth');

const router = express.Router();

/** Sign a JWT for a user row */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Sanitise user object before sending to client */
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// ─── POST /register ───────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email e password são obrigatórios.' });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Email inválido.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email já cadastrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const stmt = db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(name.trim(), email.toLowerCase().trim(), hashed);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(user);

    return res.status(201).json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email e password são obrigatórios.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const token = signToken(user);
    return res.json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

// ─── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }
    return res.json({ success: true, data: safeUser(user) });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'frontend', 'img', 'avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${req.user ? req.user.id : 'anon'}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ─── POST /avatar — upload avatar file ────────────────────────────────────────
router.post('/avatar', auth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }
    const avatarUrl = `img/avatars/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ success: true, avatar_url: avatarUrl, data: safeUser(updated) });
  } catch (err) {
    console.error('[avatar upload]', err);
    return res.status(500).json({ success: false, error: 'Erro ao fazer upload da imagem.' });
  }
});

// ─── PUT /profile ─────────────────────────────────────────────────────────────
router.put('/profile', auth, (req, res) => {
  try {
    const { name, bio, avatar_url } = req.body;

    if (!name && bio === undefined && avatar_url === undefined) {
      return res.status(400).json({ success: false, error: 'Informe pelo menos name, bio ou avatar_url para atualizar.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const updatedName   = name ? name.trim() : user.name;
    const updatedBio    = bio !== undefined ? bio : user.bio;
    const updatedAvatar = avatar_url !== undefined ? avatar_url : user.avatar_url;

    db.prepare('UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?')
      .run(updatedName, updatedBio, updatedAvatar, req.user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ success: true, data: safeUser(updated) });
  } catch (err) {
    console.error('[profile]', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
});

module.exports = router;

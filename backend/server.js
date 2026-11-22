'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ecopermuta_super_secret_key_2024_change_in_production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const express = require('express');
const cors = require('cors');

// ─── Route modules ────────────────────────────────────────────────────────────
const authRouter           = require('./routes/auth');
const itemsRouter          = require('./routes/items');
const tradesRouter         = require('./routes/trades');
const messagesRouter       = require('./routes/messages');
const exchangePointsRouter = require('./routes/exchangepoints');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dual-compatibility response transformer:
// Ensures both frontend direct-property access (.length, .filter, .token, .title)
// and structured REST access (.success, .data) work seamlessly!
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object') {
      if (body.success === true && body.data !== undefined) {
        if (Array.isArray(body.data)) {
          if (req.query.wrap !== 'true') {
            return originalJson(body.data);
          }
        } else if (body.data && typeof body.data === 'object') {
          return originalJson({
            success: true,
            ...body.data,
            data: body.data
          });
        }
      }
    }
    return originalJson(body);
  };
  next();
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',           authRouter);
app.use('/api/items',          itemsRouter);
app.use('/api/trades',         tradesRouter);
app.use('/api/messages',       messagesRouter);
app.use('/api/exchange-points', exchangePointsRouter);

// ─── Static frontend ──────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback: serve index.html for any unmatched GET (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ success: false, error: 'Erro interno inesperado.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌱 EcoPermuta rodando em http://localhost:${PORT}`);
});

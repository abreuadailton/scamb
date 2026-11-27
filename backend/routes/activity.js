'use strict';

const express = require('express');
const db      = require('../db/database');
const { activityBus } = require('../services/activityBus');

const router = express.Router();

function getLiveStats() {
  const availableItems = db.prepare(`
    SELECT COUNT(*) AS count FROM items i
    WHERE i.status = 'available'
      AND NOT EXISTS (
        SELECT 1 FROM trades t
        WHERE (t.item_offered_id = i.id OR t.item_wanted_id = i.id)
          AND t.status IN ('pending', 'accepted')
      )
  `).get()?.count || 0;
  const negotiatingItems = db.prepare(`
    SELECT COUNT(*) AS count FROM items i
    WHERE i.status = 'in_trade'
       OR (i.status = 'available' AND EXISTS (
         SELECT 1 FROM trades t
         WHERE (t.item_offered_id = i.id OR t.item_wanted_id = i.id)
           AND t.status IN ('pending', 'accepted')
       ))
  `).get()?.count || 0;
  const tradedItems     = db.prepare("SELECT COUNT(*) AS count FROM items WHERE status = 'traded'").get()?.count || 0;
  const completedTrades = db.prepare("SELECT COUNT(*) AS count FROM trades WHERE status = 'completed'").get()?.count || 0;
  const activeTrades    = db.prepare("SELECT COUNT(*) AS count FROM trades WHERE status IN ('pending', 'accepted')").get()?.count || 0;
  const exchangePoints  = db.prepare('SELECT COUNT(*) AS count FROM exchange_points').get()?.count || 0;

  return {
    available_items:   availableItems,
    negotiating_items: negotiatingItems,
    traded_items:      tradedItems,
    completed_trades:  completedTrades,
    active_trades:     activeTrades,
    exchange_points:   exchangePoints
  };
}

function getRecentEvents(limit = 50) {
  const trades = db.prepare(`
    SELECT
      t.id,
      t.status,
      t.item_wanted_id,
      t.meeting_address,
      t.created_at,
      t.updated_at,
      u_req.name AS requester_name,
      u_own.name AS owner_name,
      io.title   AS offered_title,
      iw.title   AS wanted_title,
      ep.name    AS meeting_point_name
    FROM trades t
    LEFT JOIN users u_req ON u_req.id = t.requester_id
    LEFT JOIN users u_own ON u_own.id = t.owner_id
    LEFT JOIN items io    ON io.id    = t.item_offered_id
    LEFT JOIN items iw    ON iw.id    = t.item_wanted_id
    LEFT JOIN exchange_points ep ON ep.id = t.meeting_point_id
    WHERE t.status IN ('completed', 'accepted', 'pending')
    ORDER BY COALESCE(t.updated_at, t.created_at) DESC
    LIMIT 25
  `).all();

  const items = db.prepare(`
    SELECT
      i.id,
      i.title,
      i.category,
      i.location_name,
      i.status,
      i.created_at,
      u.name AS owner_name
    FROM items i
    LEFT JOIN users u ON u.id = i.user_id
    WHERE i.status = 'available'
    ORDER BY i.created_at DESC
    LIMIT 35
  `).all();

  const ratings = db.prepare(`
    SELECT
      r.id,
      r.score,
      r.created_at,
      u_rater.name AS rater_name,
      u_rated.name AS rated_name
    FROM ratings r
    LEFT JOIN users u_rater ON u_rater.id = r.rater_id
    LEFT JOIN users u_rated ON u_rated.id = r.rated_id
    ORDER BY r.created_at DESC
    LIMIT 15
  `).all();

  const tradeEvents = trades.map(t => {
    const typeMap = {
      completed: 'trade_completed',
      accepted:  'trade_accepted',
      pending:   'trade_proposed'
    };
    const type = typeMap[t.status] || 'trade_proposed';
    return {
      id:                 `trade-${t.id}-${t.status}`,
      type,
      trade_id:           t.id,
      item_id:            t.item_wanted_id,
      actor_name:         t.requester_name || 'Participante',
      partner_name:       t.owner_name || 'Participante',
      offered_title:      t.offered_title || 'Item ofertado',
      wanted_title:       t.wanted_title || 'Item desejado',
      meeting_point_name: t.meeting_point_name || t.meeting_address || 'Ponto seguro',
      created_at:         t.updated_at || t.created_at
    };
  });

  const itemEvents = items.map(it => ({
    id:            `item-${it.id}`,
    type:          'item_created',
    item_id:       it.id,
    item_title:    it.title,
    category:      it.category || 'Outros',
    location_name: it.location_name || 'São Paulo, SP',
    actor_name:    it.owner_name || 'Membro Scamb',
    created_at:    it.created_at
  }));

  const reviewEvents = ratings.map(r => ({
    id:           `review-${r.id}`,
    type:         'review_created',
    score:        r.score || 5,
    actor_name:   r.rater_name || 'Membro',
    partner_name: r.rated_name || 'Membro',
    created_at:   r.created_at
  }));

  // Interleave trades, reviews, and listings for rich continuous variety
  const events = [];
  const maxLen = Math.max(tradeEvents.length, itemEvents.length, reviewEvents.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (tradeEvents[i]) events.push(tradeEvents[i]);
    if (itemEvents[i * 2]) events.push(itemEvents[i * 2]);
    if (reviewEvents[i]) events.push(reviewEvents[i]);
    if (itemEvents[i * 2 + 1]) events.push(itemEvents[i * 2 + 1]);
  }
  return events.slice(0, limit);
}

// ─── GET /api/activity — recent marketplace events and live counters ──────────
router.get('/', (req, res) => {
  try {
    const stats = getLiveStats();
    const events = getRecentEvents(50);
    return res.json({ success: true, data: { stats, events } });
  } catch (err) {
    console.error('[activity GET /]', err);
    return res.status(500).json({ success: false, error: 'Erro ao carregar atividade em tempo real.' });
  }
});

// ─── GET /api/activity/stream — Server-Sent Events real-time stream ───────────
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sendEvent = (eventName, payload) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  sendEvent('connected', { stats: getLiveStats(), timestamp: new Date().toISOString() });

  const onActivity = (payload) => {
    sendEvent('activity', { ...payload, stats: getLiveStats() });
  };

  activityBus.on('activity', onActivity);

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    activityBus.off('activity', onActivity);
    res.end();
  });
});

module.exports = router;

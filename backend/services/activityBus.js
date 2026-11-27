'use strict';

const { EventEmitter } = require('events');

const activityBus = new EventEmitter();
activityBus.setMaxListeners(100);

/**
 * Broadcasts a real-time marketplace event to connected SSE clients.
 */
function publishActivity(event) {
  if (!event || !event.type) return;
  const payload = {
    id: event.id || `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: event.created_at || new Date().toISOString(),
    ...event
  };
  activityBus.emit('activity', payload);
}

module.exports = {
  activityBus,
  publishActivity
};

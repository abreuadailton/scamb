'use strict';

// Teste de fumaça do fluxo principal: login → proposta → aceite → QR Code → check-in → avaliação.
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SCAMB_DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'scamb-')), 'test.db');

const app = require('../server');
const { seed } = require('../db/seed');

let server;
let base;

async function api(method, url, token, body) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

async function login(email) {
  const { body } = await api('POST', '/auth/login', null, { email, password: 'senha123' });
  return body;
}

test.before(async () => {
  await seed();
  server = app.listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

test.after(() => server.close());

test('catálogo público lista os itens do seed', async () => {
  const { status, body } = await api('GET', '/items');
  assert.equal(status, 200);
  assert.ok(body.length > 10);
});

test('rotas privadas exigem token', async () => {
  const { status } = await api('GET', '/trades');
  assert.equal(status, 401);
});

test('fluxo completo de troca presencial', async () => {
  const lucas = await login('lucas@scamb.com');
  const mariana = await login('mariana@scamb.com');

  const offered = (await api('GET', '/items/user/my', lucas.token)).body.find(i => i.status === 'available');
  const wanted = (await api('GET', '/items/user/my', mariana.token)).body.find(i => i.status === 'available');
  const proposal = { item_offered_id: offered.id, item_wanted_id: wanted.id, meeting_point_id: 1 };

  const created = await api('POST', '/trades', lucas.token, proposal);
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'pending');
  const tradeId = created.body.id;

  const duplicate = await api('POST', '/trades', lucas.token, proposal);
  assert.equal(duplicate.status, 400);

  const notOwner = await api('PUT', `/trades/${tradeId}/accept`, lucas.token);
  assert.equal(notOwner.status, 403);

  const accepted = await api('PUT', `/trades/${tradeId}/accept`, mariana.token);
  assert.equal(accepted.body.status, 'accepted');

  const qr = await api('GET', `/trades/${tradeId}/qrcode`, lucas.token);
  assert.match(qr.body.qr_code, /^data:image\/png;base64,/);

  const tooFar = await api('POST', `/trades/${tradeId}/checkin`, lucas.token, { latitude: -22.9, longitude: -43.2 });
  assert.equal(tooFar.status, 400);
  assert.equal(tooFar.body.too_far, true);

  const here = { latitude: created.body.meeting_lat, longitude: created.body.meeting_lng };
  const first = await api('POST', `/trades/${tradeId}/checkin`, lucas.token, here);
  assert.equal(first.body.status, 'accepted');
  const second = await api('POST', `/trades/${tradeId}/checkin`, mariana.token, here);
  assert.equal(second.body.status, 'completed');

  const item = await api('GET', `/items/${wanted.id}`);
  assert.equal(item.body.status, 'traded');

  const review = { trade_id: tradeId, rated_id: mariana.user.id, score: 5, comment: 'Troca tranquila!' };
  assert.equal((await api('POST', '/reviews', lucas.token, review)).status, 201);
  assert.equal((await api('POST', '/reviews', lucas.token, review)).status, 400);
});

test('não é possível avaliar sem troca concluída', async () => {
  const ana = await login('ana@scamb.com');
  const { status } = await api('POST', '/reviews', ana.token, { rated_id: 4, score: 5, comment: 'x' });
  assert.equal(status, 400);
});

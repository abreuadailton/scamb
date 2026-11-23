'use strict';

const path = require('path');
const fs = require('fs');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  // Fallback for older node versions
  const BetterSqlite3 = require('better-sqlite3');
  DatabaseSync = function(file) {
    const b = new BetterSqlite3(file);
    return b;
  };
}

const DB_PATH = path.join(__dirname, '..', 'scamb.db');
const rawDb = new DatabaseSync(DB_PATH);

// Create a wrapper object that matches better-sqlite3 API exactly
const db = {
  exec(sql) {
    return rawDb.exec(sql);
  },
  pragma(str) {
    try {
      if (typeof rawDb.pragma === 'function') {
        return rawDb.pragma(str);
      }
      return rawDb.exec('PRAGMA ' + str);
    } catch (e) {
      // WAL mode or other pragmas might be no-op or handled
    }
  },
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      run(...args) {
        return stmt.run(...args);
      },
      get(...args) {
        return stmt.get(...args);
      },
      all(...args) {
        return stmt.all(...args);
      }
    };
  },
  transaction(fn) {
    return (...args) => {
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        return result;
      } catch (err) {
        try { rawDb.exec('ROLLBACK;'); } catch (e) {}
        throw err;
      }
    };
  }
};

// Enable WAL mode & foreign keys
try { db.pragma('journal_mode = WAL'); } catch(e) {}
try { db.pragma('foreign_keys = ON'); } catch(e) {}

// ─── Create Tables ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    bio         TEXT,
    avatar_url  TEXT,
    reputation  INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    title         TEXT    NOT NULL,
    description   TEXT,
    category      TEXT,
    condition     TEXT,
    images        TEXT,
    status        TEXT    DEFAULT 'available',
    latitude      REAL,
    longitude     REAL,
    location_name TEXT,
    created_at    TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS exchange_points (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    address     TEXT,
    latitude    REAL,
    longitude   REAL,
    type        TEXT,
    description TEXT,
    schedule    TEXT
  );

  CREATE TABLE IF NOT EXISTS trades (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id      INTEGER,
    owner_id          INTEGER,
    item_offered_id   INTEGER,
    item_wanted_id    INTEGER,
    status            TEXT    DEFAULT 'pending',
    qr_code           TEXT,
    checkin_requester INTEGER DEFAULT 0,
    checkin_owner     INTEGER DEFAULT 0,
    meeting_point_id  INTEGER,
    meeting_lat       REAL,
    meeting_lng       REAL,
    meeting_address   TEXT,
    meeting_date      TEXT,
    created_at        TEXT    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id   INTEGER,
    sender_id  INTEGER,
    content    TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(trade_id)  REFERENCES trades(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id   INTEGER,
    rater_id   INTEGER,
    rated_id   INTEGER,
    score      INTEGER,
    comment    TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed Exchange Points ─────────────────────────────────────────────────────

const existingPoints = db.prepare('SELECT COUNT(*) as count FROM exchange_points').get();

if (!existingPoints || existingPoints.count === 0) {
  const insertPoint = db.prepare(`
    INSERT INTO exchange_points (name, address, latitude, longitude, type, description, schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedPoints = [
    {
      name: 'Parque Ibirapuera',
      address: 'Av. Pedro Álvares Cabral, s/n - Vila Mariana, São Paulo - SP',
      latitude: -23.5873,
      longitude: -46.6573,
      type: 'parque',
      description: 'Ponto de troca no Parque Ibirapuera, próximo ao auditório. Ambiente seguro, arborizado e movimentado.',
      schedule: 'Ter-Dom: 06h-18h'
    },
    {
      name: 'Estação Sé do Metrô',
      address: 'Praça da Sé, s/n - Centro, São Paulo - SP',
      latitude: -23.5505,
      longitude: -46.6333,
      type: 'transporte',
      description: 'Ponto de troca na saída principal da Estação Sé. Central, fácil acesso por várias linhas de metrô.',
      schedule: 'Seg-Dom: 04h40-00h'
    },
    {
      name: 'Livraria Cultura Conjunto Nacional',
      address: 'Av. Paulista, 2073 - Bela Vista, São Paulo - SP',
      latitude: -23.5559,
      longitude: -46.6611,
      type: 'comercio',
      description: 'Ponto de troca no hall de entrada da Livraria Cultura, Conjunto Nacional.',
      schedule: 'Seg-Sab: 09h-22h | Dom: 12h-20h'
    },
    {
      name: 'Parque Villa-Lobos',
      address: 'Av. Prof. Fonseca Rodrigues, 2001 - Alto de Pinheiros, São Paulo - SP',
      latitude: -23.5455,
      longitude: -46.7318,
      type: 'parque',
      description: 'Ponto de troca no Parque Villa-Lobos, próximo à portaria principal. Excelente para finais de semana.',
      schedule: 'Ter-Dom: 06h-18h'
    },
    {
      name: 'MASP - Museu de Arte de São Paulo',
      address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
      latitude: -23.5614,
      longitude: -46.6560,
      type: 'cultura',
      description: 'Ponto de troca no vão livre do MASP. Ponto de encontro tradicional e movimentado na Avenida Paulista.',
      schedule: 'Seg-Dom: 08h-20h'
    }
  ];

  const insertMany = db.transaction((points) => {
    for (const p of points) {
      insertPoint.run(p.name, p.address, p.latitude, p.longitude, p.type, p.description, p.schedule);
    }
  });

  insertMany(seedPoints);
  console.log('✅ Exchange points seed concluído com 5 pontos seguros em São Paulo.');
}

module.exports = db;

import fs from 'fs';
import os from 'os';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export const emptyDB = {
  platformSettings: { commissionRate: 0.15, currency: 'PKR' },
  users: [],
  trainers: [],
  trainerDocuments: [],
  leads: [],
  reviews: [],
  protocols: [],
  bookings: [],
  payments: [],
  payouts: [],
  disputes: [],
  statsEvents: []
};

const entityTables = [
  'users',
  'trainers',
  'trainerDocuments',
  'leads',
  'reviews',
  'protocols',
  'bookings',
  'payments',
  'payouts',
  'disputes',
  'statsEvents'
];

const clone = (data) => JSON.parse(JSON.stringify(data));
const parsePayload = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function createSQLiteStore({ rootDir, seedFile, isServerless }) {
  const dbFile = process.env.Liftrz_SQLITE_PATH
    || (isServerless ? path.join(process.env.TMPDIR || os.tmpdir(), 'Liftrz.sqlite') : path.join(rootDir, 'Liftrz.sqlite'));

  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const sqlite = new DatabaseSync(dbFile);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL
    );
  `);

  for (const table of entityTables) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      );
    `);
  }

  const readCollection = (table) => sqlite
    .prepare(`SELECT payload FROM ${table} ORDER BY rowid`)
    .all()
    .map((row) => parsePayload(row.payload, {}));

  const writeCollection = (table, items) => {
    sqlite.prepare(`DELETE FROM ${table}`).run();
    const insert = sqlite.prepare(`INSERT INTO ${table} (id, payload) VALUES (?, ?)`);
    for (const item of items) {
      if (!item?.id) continue;
      insert.run(item.id, JSON.stringify(item));
    }
  };

  const normalizeDB = (data) => ({
    platformSettings: data?.platformSettings || clone(emptyDB.platformSettings),
    users: Array.isArray(data?.users) ? data.users : [],
    trainers: Array.isArray(data?.trainers) ? data.trainers : [],
    trainerDocuments: Array.isArray(data?.trainerDocuments) ? data.trainerDocuments : [],
    leads: Array.isArray(data?.leads) ? data.leads : [],
    reviews: Array.isArray(data?.reviews) ? data.reviews : [],
    protocols: Array.isArray(data?.protocols) ? data.protocols : [],
    bookings: Array.isArray(data?.bookings) ? data.bookings : [],
    payments: Array.isArray(data?.payments) ? data.payments : [],
    payouts: Array.isArray(data?.payouts) ? data.payouts : [],
    disputes: Array.isArray(data?.disputes) ? data.disputes : [],
    statsEvents: Array.isArray(data?.statsEvents) ? data.statsEvents : []
  });

  const readDB = async () => {
    const settingsRow = sqlite.prepare('SELECT payload FROM platform_settings WHERE id = 1').get();
    return {
      platformSettings: parsePayload(settingsRow?.payload, clone(emptyDB.platformSettings)),
      users: readCollection('users'),
      trainers: readCollection('trainers'),
      trainerDocuments: readCollection('trainerDocuments'),
      leads: readCollection('leads'),
      reviews: readCollection('reviews'),
      protocols: readCollection('protocols'),
      bookings: readCollection('bookings'),
      payments: readCollection('payments'),
      payouts: readCollection('payouts'),
      disputes: readCollection('disputes'),
      statsEvents: readCollection('statsEvents')
    };
  };

  const writeDB = async (data) => {
    const next = normalizeDB(clone(data));
    sqlite.exec('BEGIN');
    try {
      sqlite.prepare('DELETE FROM platform_settings').run();
      sqlite.prepare('INSERT INTO platform_settings (id, payload) VALUES (1, ?)').run(JSON.stringify(next.platformSettings));
      for (const table of entityTables) {
        writeCollection(table, next[table]);
      }
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  };

  const hasSeed = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0
    || sqlite.prepare('SELECT COUNT(*) AS count FROM trainers').get().count > 0
    || sqlite.prepare('SELECT COUNT(*) AS count FROM bookings').get().count > 0;

  if (!hasSeed) {
    const seeded = fs.existsSync(seedFile)
      ? parsePayload(fs.readFileSync(seedFile, 'utf8'), emptyDB)
      : emptyDB;
    writeDB(seeded);
  }

  return {
    dbFile,
    readDB,
    writeDB
  };
}

import fs from 'fs';
import { emptyDB } from './sqlite-store.js';

const STORE_TABLE = 'Liftrz_state';

const clone = (data) => JSON.parse(JSON.stringify(data));
const normalizeSupabaseUrl = (value = '') => {
  const cleaned = String(value).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/g, '');
  const projectRoot = cleaned.match(/^(https?:\/\/[^/]+\.supabase\.co)(?:\/.*)?$/i);
  if (projectRoot) return projectRoot[1];
  return cleaned.replace(/\/(rest|storage)\/v1.*$/i, '');
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

async function requestJSON(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }

  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  const error = await res.text().catch(() => '');
  throw new Error(`Supabase request failed (${res.status}): ${error || res.statusText}`);
}

export function createSupabaseStore({ seedFile }) {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const restUrl = `${url}/rest/v1/${STORE_TABLE}`;

  const readDB = async () => {
    const data = await requestJSON(`${restUrl}?select=payload&id=eq.1`, { method: 'GET' });
    if (Array.isArray(data) && data[0]?.payload) {
      const existing = normalizeDB(data[0].payload);
      if (existing.users.length > 0 || existing.trainers.length > 0) {
        return existing;
      }

      const seeded = fs.existsSync(seedFile)
        ? JSON.parse(fs.readFileSync(seedFile, 'utf8'))
        : emptyDB;
      await writeDB(seeded);
      return normalizeDB(seeded);
    }

    const seeded = fs.existsSync(seedFile)
      ? JSON.parse(fs.readFileSync(seedFile, 'utf8'))
      : emptyDB;
    await writeDB(seeded);
    return normalizeDB(seeded);
  };

  const writeDB = async (data) => {
    const next = normalizeDB(clone(data));
    await requestJSON(`${restUrl}?on_conflict=id`, {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([{ id: 1, payload: next }])
    });
    return next;
  };

  return {
    readDB,
    writeDB
  };
}

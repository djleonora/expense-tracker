import { pool } from './db.js';
import { insertSeed } from './seed.js';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function ensureGuest(guestId, localDate) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rowCount } = await client.query(
      'INSERT INTO guests (guest_id) VALUES ($1) ON CONFLICT (guest_id) DO NOTHING',
      [guestId]
    );

    if (rowCount === 1) {
      await insertSeed(client, guestId, localDate);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function requireGuest(req, res, next) {
  const guestId = req.get('x-guest-id');
  const localDate = req.get('x-local-date');

  if (!guestId || !UUID_RE.test(guestId)) {
    return res.status(400).json({ error: 'Missing or invalid x-guest-id header.' });
  }
  if (!localDate || !DATE_RE.test(localDate)) {
    return res.status(400).json({ error: 'Missing or invalid x-local-date header (YYYY-MM-DD).' });
  }

  try {
    await ensureGuest(guestId, localDate);
    req.guestId = guestId;
    req.localDate = localDate;
    next();
  } catch (err) {
    next(err);
  }
}
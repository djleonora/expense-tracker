import { Router } from 'express';
import { pool } from './db.js';
import { requireGuest, UUID_RE } from './guest.js';
import { insertSeed } from './seed.js';

const router = Router();

// Every route in this router requires a valid guest.
router.use(requireGuest);

const TYPES = ['income', 'expense'];
const CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'health',
                    'entertainment', 'salary', 'gift', 'other'];

const LIST_SQL = `
  SELECT id, type, title, amount::float8 AS amount, category, date::text AS date
  FROM transactions
  WHERE guest_id = $1
  ORDER BY date DESC, created_at DESC`;

// Cast date::text on purpose. node-pg turns DATE into a JS Date at local midnight,
// and that can shift the day when it's serialized to JSON.

function parseBody(body = {}) {
  const type = body.type;
  const title = String(body.title ?? '').trim();
  const amount = Number(body.amount);
  const category = body.category;

  if (!TYPES.includes(type)) return { error: 'type must be income or expense.' };
  if (title.length < 1 || title.length > 100) return { error: 'title must be 1-100 characters.' };
  if (!Number.isInteger(amount) || amount <= 0) return { error: 'amount must be a positive whole number.' };
  if (!CATEGORIES.includes(category)) return { error: 'Unknown category.' };

  return { value: { type, title, amount, category } };
}

// GET /api/transactions
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(LIST_SQL, [req.guestId]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  const { value, error } = parseBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { rows } = await pool.query(
      `INSERT INTO transactions (guest_id, type, title, amount, category, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, title, amount::float8 AS amount, category, date::text AS date`,
      [req.guestId, value.type, value.title, value.amount, value.category, req.localDate]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', async (req, res, next) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid transaction id.' });
  }
  const { value, error } = parseBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { rows } = await pool.query(
      `UPDATE transactions
       SET type = $1, title = $2, amount = $3, category = $4
       WHERE id = $5 AND guest_id = $6
       RETURNING id, type, title, amount::float8 AS amount, category, date::text AS date`,
      [value.type, value.title, value.amount, value.category, req.params.id, req.guestId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid transaction id.' });
  }

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND guest_id = $2',
      [req.params.id, req.guestId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/reset: delete this guest's rows, then re-seed
router.post('/reset', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM transactions WHERE guest_id = $1', [req.guestId]);
    await insertSeed(client, req.guestId, req.localDate);
    const { rows } = await client.query(LIST_SQL, [req.guestId]);
    await client.query('COMMIT');
    res.json(rows);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/transactions: clear everything for this guest
router.delete('/', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM transactions WHERE guest_id = $1', [req.guestId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const q = z.string().optional().parse(req.query['q']);
    const conditions = q ? ['name ILIKE $1'] : [];
    const params = q ? [`%${q}%`] : [];

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT * FROM classes ${where} ORDER BY name ASC`, params);
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const cls = await queryOne('SELECT * FROM classes WHERE id = $1', [req.params['id']]);
    if (!cls) throw new ApiError(404, 'Class not found');

    const subclasses = await query('SELECT * FROM subclasses WHERE class_id = $1 ORDER BY name ASC', [req.params['id']]);
    res.json({ ...cls, subclasses: subclasses.rows });
  } catch (err) {
    next(err);
  }
});

export { router as classesRouter };

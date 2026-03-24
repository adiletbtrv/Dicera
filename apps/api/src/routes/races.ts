import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const RaceFilterSchema = z.object({
  q: z.string().optional(),
  size: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = RaceFilterSchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.q) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${filters.q}%`);
      p++;
    }
    if (filters.size) {
      conditions.push(`size = $${p}`);
      params.push(filters.size);
      p++;
    }
    if (filters.source) {
      conditions.push(`source = $${p}`);
      params.push(filters.source);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.limit;

    const [rows, countResult] = await Promise.all([
      query(`SELECT * FROM races ${where} ORDER BY name ASC LIMIT $${p} OFFSET $${p + 1}`, [...params, filters.limit, offset]),
      query(`SELECT COUNT(*) FROM races ${where}`, params),
    ]);

    res.json({
      data: rows.rows,
      total: parseInt(String(countResult.rows[0]?.['count'] ?? '0')),
      page: filters.page,
      limit: filters.limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const race = await queryOne('SELECT * FROM races WHERE id = $1', [req.params['id']]);
    if (!race) throw new ApiError(404, 'Race not found');
    res.json(race);
  } catch (err) {
    next(err);
  }
});

export { router as racesRouter };

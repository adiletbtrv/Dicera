import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const ItemFilterSchema = z.object({
  q: z.string().optional(),
  rarity: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = ItemFilterSchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.q) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${filters.q}%`);
      p++;
    }
    if (filters.rarity) {
      conditions.push(`rarity = $${p}`);
      params.push(filters.rarity);
      p++;
    }
    if (filters.category) {
      conditions.push(`category = $${p}`);
      params.push(filters.category);
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
      query(`SELECT * FROM items ${where} ORDER BY name ASC LIMIT $${p} OFFSET $${p + 1}`, [...params, filters.limit, offset]),
      query(`SELECT COUNT(*) FROM items ${where}`, params),
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
    const item = await queryOne('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (!item) throw new ApiError(404, 'Item not found');
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export { router as itemsRouter };

import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const SpellFilterSchema = z.object({
  q: z.string().optional(),
  ids: z.string().optional(),
  level: z.coerce.number().int().min(0).max(9).optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  concentration: z.enum(['true', 'false']).optional(),
  ritual: z.enum(['true', 'false']).optional(),
  source: z.string().optional(),
  homebrew: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = SpellFilterSchema.parse(req.query);

    if (filters.ids) {
      const ids = filters.ids.split(',').map((s) => s.trim()).filter(Boolean);
      const rows = await query('SELECT * FROM spells WHERE id = ANY($1)', [ids]);
      res.json({ data: rows.rows, total: rows.rows.length, page: 1, limit: ids.length });
      return;
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.q) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${filters.q}%`);
      p++;
    }
    if (filters.level !== undefined) {
      conditions.push(`level = $${p}`);
      params.push(filters.level);
      p++;
    }
    if (filters.school) {
      conditions.push(`school = $${p}`);
      params.push(filters.school.toLowerCase());
      p++;
    }
    if (filters.class) {
      conditions.push(`$${p} = ANY(classes)`);
      params.push(filters.class.toLowerCase());
      p++;
    }
    if (filters.concentration !== undefined) {
      conditions.push(`concentration = $${p}`);
      params.push(filters.concentration === 'true');
      p++;
    }
    if (filters.ritual !== undefined) {
      conditions.push(`ritual = $${p}`);
      params.push(filters.ritual === 'true');
      p++;
    }
    if (filters.source) {
      conditions.push(`source = $${p}`);
      params.push(filters.source);
      p++;
    }
    if (filters.homebrew !== undefined) {
      conditions.push(`homebrew = $${p}`);
      params.push(filters.homebrew === 'true');
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.limit;

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT * FROM spells ${where} ORDER BY level ASC, name ASC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, filters.limit, offset],
      ),
      query(`SELECT COUNT(*) FROM spells ${where}`, params),
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
    const spell = await queryOne('SELECT * FROM spells WHERE id = $1', [req.params['id']]);
    if (!spell) throw new ApiError(404, 'Spell not found');
    res.json(spell);
  } catch (err) {
    next(err);
  }
});

export { router as spellsRouter };


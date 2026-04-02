import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const MonsterFilterSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  size: z.string().optional(),
  cr: z.string().optional(),
  cr_min: z.string().optional(),
  cr_max: z.string().optional(),
  alignment: z.string().optional(),
  environment: z.string().optional(),
  source: z.string().optional(),
  homebrew: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function crToNumber(cr: string): number {
  if (cr.includes('/')) {
    const [n, d] = cr.split('/').map(Number);
    return (n ?? 1) / (d ?? 1);
  }
  return parseFloat(cr) || 0;
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = MonsterFilterSchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.q) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${filters.q}%`);
      p++;
    }
    if (filters.type) {
      conditions.push(`type ILIKE $${p}`);
      params.push(`%${filters.type}%`);
      p++;
    }
    if (filters.size) {
      conditions.push(`size = $${p}`);
      params.push(filters.size.toLowerCase());
      p++;
    }
    if (filters.cr) {
      conditions.push(`challenge_rating = $${p}`);
      params.push(filters.cr);
      p++;
    }
    if (filters.alignment) {
      conditions.push(`alignment ILIKE $${p}`);
      params.push(`%${filters.alignment}%`);
      p++;
    }
    if (filters.environment) {
      conditions.push(`$${p} = ANY(environments)`);
      params.push(filters.environment.toLowerCase());
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
    if (filters.cr_min) {
      conditions.push(`cr_numeric >= $${p}`);
      params.push(crToNumber(filters.cr_min));
      p++;
    }
    if (filters.cr_max) {
      conditions.push(`cr_numeric <= $${p}`);
      params.push(crToNumber(filters.cr_max));
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.limit;

    let rows = await query(
      `SELECT id, name, size, type, subtype, alignment, armor_class, hit_points,
              challenge_rating, xp, source, page, environments, image_url, homebrew
       FROM monsters ${where} ORDER BY name ASC LIMIT $${p} OFFSET $${p + 1}`,
      [...params, filters.limit, offset],
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM monsters ${where}`,
      params,
    );

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
    const monster = await queryOne('SELECT * FROM monsters WHERE id = $1', [req.params['id']]);
    if (!monster) throw new ApiError(404, 'Monster not found');
    res.json(monster);
  } catch (err) {
    next(err);
  }
});

export { router as monstersRouter };

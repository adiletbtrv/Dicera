import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const HomebrewSchema = z.object({
  type: z.enum(['spell', 'monster', 'item', 'class', 'subclass', 'race', 'subrace', 'background', 'feat', 'rule']),
  name: z.string().min(1).max(200),
  description: z.string().default(''),
  content: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  version: z.string().default('1.0'),
  parent_id: z.string().uuid().optional(),
});

const FilterSchema = z.object({
  type: z.string().optional(),
  q: z.string().optional(),
  is_public: z.enum(['true', 'false']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = FilterSchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.mine === 'true' && req.user) {
      conditions.push(`creator_id = $${p}`);
      params.push(req.user.id);
      p++;
    } else {
      conditions.push(`(is_public = true OR creator_id = $${p})`);
      params.push(req.user?.id ?? '00000000-0000-0000-0000-000000000000');
      p++;
    }

    if (filters.type) {
      conditions.push(`type = $${p}`);
      params.push(filters.type);
      p++;
    }
    if (filters.q) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${filters.q}%`);
      p++;
    }
    if (filters.is_public !== undefined) {
      conditions.push(`is_public = $${p}`);
      params.push(filters.is_public === 'true');
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.limit;

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT id, type, name, description, tags, is_public, status, likes, views, version, creator_id, created_at
         FROM homebrew ${where} ORDER BY updated_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, filters.limit, offset],
      ),
      query(`SELECT COUNT(*) FROM homebrew ${where}`, params),
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
    const hb = await queryOne(
      `SELECT * FROM homebrew WHERE id = $1 AND (is_public = true OR creator_id = $2)`,
      [req.params['id'], req.user?.id ?? '00000000-0000-0000-0000-000000000000'],
    );
    if (!hb) throw new ApiError(404, 'Homebrew not found');

    await query('UPDATE homebrew SET views = views + 1 WHERE id = $1', [req.params['id']]).catch(() => null);
    res.json(hb);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = HomebrewSchema.parse(req.body);
    const id = uuidv4();

    await query(
      `INSERT INTO homebrew (id, creator_id, type, status, name, description, content, tags, is_public, version, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id, req.user!.id, body.type, body.status, body.name,
        body.description, JSON.stringify(body.content),
        body.tags, body.is_public, body.version, body.parent_id ?? null,
      ],
    );

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await queryOne(
      'SELECT id FROM homebrew WHERE id = $1 AND creator_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (!existing) throw new ApiError(404, 'Homebrew not found');

    const body = HomebrewSchema.partial().parse(req.body);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    const jsonFields = new Set(['content']);

    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${p}`);
        params.push(jsonFields.has(key) ? JSON.stringify(value) : value);
        p++;
      }
    }
    if (setClauses.length > 0) {
      params.push(req.params['id']);
      await query(`UPDATE homebrew SET ${setClauses.join(', ')} WHERE id = $${p}`, params);
    }
    res.json({ id: req.params['id'] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM homebrew WHERE id = $1 AND creator_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (result.rowCount === 0) throw new ApiError(404, 'Homebrew not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE homebrew SET likes = likes + 1 WHERE id = $1', [req.params['id']]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as homebrewRouter };

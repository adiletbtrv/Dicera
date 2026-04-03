import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, transaction } from '../db/client.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const TokenSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']).default('medium'),
  color: z.string().default('#ff0000'),
  image_url: z.string().url().optional(),
  monster_id: z.string().optional(),
  character_id: z.string().optional(),
  npc_id: z.string().optional(),
  hp: z.number().int().optional(),
  max_hp: z.number().int().optional(),
  conditions: z.array(z.string()).default([]),
  initiative: z.number().int().optional(),
  is_hidden: z.boolean().default(false),
  notes: z.string().optional(),
});

const UploadMapSchema = z.object({
  name: z.string().min(1),
  width_px: z.preprocess(v => Number(v), z.number().int().min(1)),
  height_px: z.preprocess(v => Number(v), z.number().int().min(1)),
  grid_size_px: z.preprocess(v => Number(v), z.number().int().default(50)),
  grid_enabled: z.preprocess(v => v === 'true', z.boolean().default(true)),
  fog_of_war_enabled: z.preprocess(v => v === 'true', z.boolean().default(false)),
  campaign_id: z.string().uuid().optional().catch(undefined),
  is_public: z.preprocess(v => v === 'true', z.boolean().default(false)),
  notes: z.string().optional().default(''),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id ?? '00000000-0000-0000-0000-000000000000';
    const rows = await query(
      `SELECT id, name, image_url, width_px, height_px, grid_enabled,
              fog_of_war_enabled, is_public, campaign_id, created_at
       FROM maps WHERE (creator_id = $1 OR is_public = true)
       ORDER BY created_at DESC`,
      [userId],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id ?? '00000000-0000-0000-0000-000000000000';
    const map = await queryOne(
      'SELECT * FROM maps WHERE id = $1 AND (creator_id = $2 OR is_public = true)',
      [req.params['id'], userId],
    );
    if (!map) throw new ApiError(404, 'Map not found');
    res.json(map);
  } catch (err) {
    next(err);
  }
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    const body = UploadMapSchema.parse(req.body);
    const file = req.file;
    if (!file) throw new ApiError(400, 'Image file is required');

    const id = uuidv4();
    const image_url = `/api/maps/${id}/image`;

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO maps (id, creator_id, campaign_id, name, image_url, width_px, height_px,
           grid_size_px, grid_enabled, fog_of_war_enabled, is_public, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          id, req.user!.id, body.campaign_id ?? null, body.name, image_url,
          body.width_px, body.height_px, body.grid_size_px, body.grid_enabled,
          body.fog_of_war_enabled, body.is_public, body.notes,
        ],
      );

      await client.query(
        `INSERT INTO map_images (map_id, image_data, content_type) VALUES ($1, $2, $3)`,
        [id, file.buffer, file.mimetype],
      );
    });

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/image', async (req, res, next) => {
  try {
    const mapImage = await queryOne(
      'SELECT image_data, content_type FROM map_images WHERE map_id = $1',
      [req.params['id']]
    );
    if (!mapImage) throw new ApiError(404, 'Image not found');

    res.setHeader('Content-Type', mapImage.content_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(mapImage.image_data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/tokens', requireAuth, async (req, res, next) => {
  try {
    await assertMapOwner(req.params['id']!, req.user!.id);
    const tokens = z.array(TokenSchema).parse(req.body);
    await query('UPDATE maps SET tokens = $1 WHERE id = $2', [JSON.stringify(tokens), req.params['id']]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/fog', requireAuth, async (req, res, next) => {
  try {
    await assertMapOwner(req.params['id']!, req.user!.id);
    const { revealed_cells } = z.object({
      revealed_cells: z.array(z.tuple([z.number(), z.number()])),
    }).parse(req.body);

    await query(
      'UPDATE maps SET fog_revealed_cells = $1 WHERE id = $2',
      [JSON.stringify(revealed_cells), req.params['id']],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/annotations', requireAuth, async (req, res, next) => {
  try {
    await assertMapOwner(req.params['id']!, req.user!.id);
    const annotations = z.array(z.object({
      id: z.string(),
      type: z.enum(['pin', 'text', 'shape', 'fog']),
      x: z.number(),
      y: z.number(),
      label: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      is_hidden: z.boolean().default(false),
    })).parse(req.body);

    await query('UPDATE maps SET annotations = $1 WHERE id = $2', [JSON.stringify(annotations), req.params['id']]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM maps WHERE id = $1 AND creator_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (result.rowCount === 0) throw new ApiError(404, 'Map not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

async function assertMapOwner(mapId: string, userId: string) {
  const map = await queryOne('SELECT id FROM maps WHERE id = $1 AND creator_id = $2', [mapId, userId]);
  if (!map) throw new ApiError(404, 'Map not found');
}

export { router as mapsRouter };

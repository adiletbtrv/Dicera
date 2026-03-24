import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const CampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().default(''),
  setting: z.string().default(''),
  system: z.string().default('D&D 5e'),
  is_public: z.boolean().default(false),
});

const NpcSchema = z.object({
  name: z.string().min(1),
  race: z.string().optional(),
  occupation: z.string().optional(),
  location_id: z.string().uuid().optional(),
  alignment: z.string().optional(),
  description: z.string().default(''),
  personality: z.string().default(''),
  motivations: z.string().default(''),
  secrets: z.string().default(''),
  notes: z.string().default(''),
  tags: z.array(z.string()).default([]),
  is_alive: z.boolean().default(true),
});

const SessionNoteSchema = z.object({
  session_number: z.number().int().min(1),
  title: z.string().min(1),
  date_played: z.string().date().optional(),
  summary: z.string().default(''),
  notes: z.string().default(''),
  xp_awarded: z.number().int().min(0).default(0),
  loot_notes: z.string().default(''),
});

async function assertCampaignOwner(campaignId: string, userId: string) {
  const campaign = await queryOne(
    'SELECT id FROM campaigns WHERE id = $1 AND owner_id = $2',
    [campaignId, userId],
  );
  if (!campaign) throw new ApiError(404, 'Campaign not found');
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, name, description, setting, system, status, is_public,
              image_url, created_at, updated_at
       FROM campaigns WHERE owner_id = $1 ORDER BY updated_at DESC`,
      [req.user!.id],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const campaign = await queryOne(
      'SELECT * FROM campaigns WHERE id = $1 AND (owner_id = $2 OR is_public = true)',
      [req.params['id'], req.user!.id],
    );
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = CampaignSchema.parse(req.body);
    const id = uuidv4();

    await query(
      `INSERT INTO campaigns (id, owner_id, name, description, setting, system, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.user!.id, body.name, body.description, body.setting, body.system, body.is_public],
    );

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const body = CampaignSchema.partial().parse(req.body);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${p}`);
        params.push(value);
        p++;
      }
    }
    if (setClauses.length > 0) {
      params.push(req.params['id']);
      await query(`UPDATE campaigns SET ${setClauses.join(', ')} WHERE id = $${p}`, params);
    }
    res.json({ id: req.params['id'] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM campaigns WHERE id = $1 AND owner_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (result.rowCount === 0) throw new ApiError(404, 'Campaign not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/:id/npcs', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const rows = await query(
      'SELECT * FROM npcs WHERE campaign_id = $1 ORDER BY name ASC',
      [req.params['id']],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/npcs', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const body = NpcSchema.parse(req.body);
    const npcId = uuidv4();

    await query(
      `INSERT INTO npcs (id, campaign_id, name, race, occupation, location_id,
         alignment, description, personality, motivations, secrets, notes, tags, is_alive)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        npcId, req.params['id'], body.name, body.race ?? null,
        body.occupation ?? null, body.location_id ?? null,
        body.alignment ?? null, body.description, body.personality,
        body.motivations, body.secrets, body.notes, body.tags, body.is_alive,
      ],
    );

    res.status(201).json({ id: npcId });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/npcs/:npcId', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const body = NpcSchema.partial().parse(req.body);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) { setClauses.push(`${key} = $${p}`); params.push(value); p++; }
    }
    if (setClauses.length > 0) {
      params.push(req.params['npcId']);
      await query(`UPDATE npcs SET ${setClauses.join(', ')} WHERE id = $${p}`, params);
    }
    res.json({ id: req.params['npcId'] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/sessions', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const rows = await query(
      'SELECT * FROM session_notes WHERE campaign_id = $1 ORDER BY session_number ASC',
      [req.params['id']],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/sessions', requireAuth, async (req, res, next) => {
  try {
    await assertCampaignOwner(req.params['id']!, req.user!.id);
    const body = SessionNoteSchema.parse(req.body);
    const sessionId = uuidv4();

    await query(
      `INSERT INTO session_notes (id, campaign_id, session_number, title, date_played,
         summary, notes, xp_awarded, loot_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        sessionId, req.params['id'], body.session_number, body.title,
        body.date_played ?? null, body.summary, body.notes,
        body.xp_awarded, body.loot_notes,
      ],
    );

    res.status(201).json({ id: sessionId });
  } catch (err) {
    next(err);
  }
});

export { router as campaignsRouter };

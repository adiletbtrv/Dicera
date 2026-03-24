import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';
import {
  XP_BY_CR,
  XP_THRESHOLDS_BY_LEVEL,
  type EncounterDifficulty,
} from '@dnd/data';

const router = Router();

const EncounterMonsterSchema = z.object({
  monster_id: z.string(),
  monster_name: z.string(),
  quantity: z.number().int().min(1).default(1),
  xp_each: z.number().int().min(0),
  cr: z.union([z.number(), z.string()]),
  custom_hp: z.number().int().optional(),
  custom_name: z.string().optional(),
  notes: z.string().optional(),
});

const EncounterSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  campaign_id: z.string().uuid().optional(),
  monsters: z.array(EncounterMonsterSchema).default([]),
  party_size: z.number().int().min(1).default(4),
  party_level: z.number().int().min(1).max(20).default(5),
  environment: z.string().optional(),
  notes: z.string().default(''),
  is_template: z.boolean().default(false),
  is_public: z.boolean().default(false),
});

const MONSTER_MULTIPLIERS: Record<number, number> = {
  1: 1, 2: 1.5, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2.5, 8: 2.5,
  9: 2.5, 10: 2.5, 11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
};

function getMultiplier(count: number): number {
  for (const [threshold, multiplier] of Object.entries(MONSTER_MULTIPLIERS).reverse()) {
    if (count >= parseInt(threshold)) return multiplier;
  }
  return 1;
}

function calculateEncounterDifficulty(
  monsters: z.infer<typeof EncounterMonsterSchema>[],
  partySize: number,
  partyLevel: number,
): { difficulty: EncounterDifficulty; totalXp: number; adjustedXp: number; xpPerPlayer: number } {
  const totalXp = monsters.reduce((sum, m) => sum + m.xp_each * m.quantity, 0);
  const totalMonsters = monsters.reduce((sum, m) => sum + m.quantity, 0);
  const multiplier = getMultiplier(totalMonsters);
  const adjustedXp = Math.round(totalXp * multiplier);
  const xpPerPlayer = Math.round(totalXp / partySize);

  const thresholds = XP_THRESHOLDS_BY_LEVEL[partyLevel] ?? XP_THRESHOLDS_BY_LEVEL[1]!;
  const partyThresholds = {
    easy: (thresholds['easy'] ?? 25) * partySize,
    medium: (thresholds['medium'] ?? 50) * partySize,
    hard: (thresholds['hard'] ?? 75) * partySize,
    deadly: (thresholds['deadly'] ?? 100) * partySize,
  };

  let difficulty: EncounterDifficulty = 'easy';
  if (adjustedXp >= partyThresholds.deadly) difficulty = 'deadly';
  else if (adjustedXp >= partyThresholds.hard) difficulty = 'hard';
  else if (adjustedXp >= partyThresholds.medium) difficulty = 'medium';

  return { difficulty, totalXp, adjustedXp, xpPerPlayer };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const rows = await query(
      `SELECT id, name, description, party_size, party_level, difficulty,
              total_xp, adjusted_xp, is_public, is_template, created_at
       FROM encounters
       WHERE (creator_id = $1 OR is_public = true OR is_template = true)
       ORDER BY created_at DESC`,
      [userId ?? '00000000-0000-0000-0000-000000000000'],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/xp-table', (_req, res) => {
  res.json({ xpByCr: XP_BY_CR, thresholdsByLevel: XP_THRESHOLDS_BY_LEVEL });
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const encounter = await queryOne(
      `SELECT * FROM encounters WHERE id = $1
       AND (creator_id = $2 OR is_public = true OR is_template = true)`,
      [req.params['id'], req.user?.id ?? '00000000-0000-0000-0000-000000000000'],
    );
    if (!encounter) throw new ApiError(404, 'Encounter not found');
    res.json(encounter);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = EncounterSchema.parse(req.body);
    const { difficulty, totalXp, adjustedXp, xpPerPlayer } = calculateEncounterDifficulty(
      body.monsters,
      body.party_size,
      body.party_level,
    );
    const id = uuidv4();

    await query(
      `INSERT INTO encounters (
        id, campaign_id, creator_id, name, description, monsters,
        party_size, party_level, difficulty, total_xp, adjusted_xp,
        xp_per_player, environment, notes, is_template, is_public
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id, body.campaign_id ?? null, req.user!.id, body.name, body.description,
        JSON.stringify(body.monsters), body.party_size, body.party_level,
        difficulty, totalXp, adjustedXp, xpPerPlayer,
        body.environment ?? null, body.notes, body.is_template, body.is_public,
      ],
    );

    res.status(201).json({ id, difficulty, totalXp, adjustedXp, xpPerPlayer });
  } catch (err) {
    next(err);
  }
});

router.post('/calculate', (_req, res, next) => {
  try {
    const body = EncounterSchema.parse(_req.body);
    const result = calculateEncounterDifficulty(body.monsters, body.party_size, body.party_level);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM encounters WHERE id = $1 AND creator_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (result.rowCount === 0) throw new ApiError(404, 'Encounter not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export { router as encountersRouter };

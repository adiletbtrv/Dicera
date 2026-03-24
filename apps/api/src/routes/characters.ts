import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const CharacterUpsertSchema = z.object({
  name: z.string().min(1).max(100),
  race_id: z.string(),
  race_name: z.string(),
  subrace_id: z.string().optional(),
  subrace_name: z.string().optional(),
  background_id: z.string(),
  background_name: z.string(),
  alignment: z.string().default('true neutral'),
  experience_points: z.number().int().min(0).default(0),
  classes: z.array(z.object({
    class_id: z.string(),
    class_name: z.string(),
    level: z.number().int().min(1).max(20),
    subclass_id: z.string().optional(),
    subclass_name: z.string().optional(),
  })),
  total_level: z.number().int().min(1).max(20),
  ability_scores: z.object({
    str: z.number().int().min(1).max(30),
    dex: z.number().int().min(1).max(30),
    con: z.number().int().min(1).max(30),
    int: z.number().int().min(1).max(30),
    wis: z.number().int().min(1).max(30),
    cha: z.number().int().min(1).max(30),
  }),
  max_hit_points: z.number().int().min(1),
  current_hit_points: z.number().int(),
  armor_class: z.number().int().min(1),
  initiative_bonus: z.number().int().default(0),
  speed: z.number().int().min(0).default(30),
  proficiency_bonus: z.number().int().min(2).max(6),
  passive_perception: z.number().int().default(10),
  hit_dice_total: z.string(),
  saving_throw_proficiencies: z.array(z.string()).default([]),
  skill_proficiencies: z.array(z.string()).default([]),
  personality_traits: z.string().default(''),
  ideals: z.string().default(''),
  bonds: z.string().default(''),
  flaws: z.string().default(''),
  backstory: z.string().default(''),
  notes: z.string().default(''),
  campaign_id: z.string().uuid().optional(),
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, name, race_name, background_name, total_level, classes,
              current_hit_points, max_hit_points, image_url, campaign_id, created_at
       FROM characters WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user!.id],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const character = await queryOne(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (!character) throw new ApiError(404, 'Character not found');
    res.json(character);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = CharacterUpsertSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO characters (
        id, user_id, name, race_id, race_name, subrace_id, subrace_name,
        background_id, background_name, alignment, experience_points,
        classes, total_level, ability_scores, saving_throw_proficiencies,
        skill_proficiencies, max_hit_points, current_hit_points,
        hit_dice_total, armor_class, initiative_bonus, speed,
        proficiency_bonus, passive_perception, personality_traits,
        ideals, bonds, flaws, backstory, notes, campaign_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28, $29, $30, $31
      )`,
      [
        id, req.user!.id, body.name, body.race_id, body.race_name,
        body.subrace_id ?? null, body.subrace_name ?? null,
        body.background_id, body.background_name, body.alignment,
        body.experience_points, JSON.stringify(body.classes), body.total_level,
        JSON.stringify(body.ability_scores), body.saving_throw_proficiencies,
        body.skill_proficiencies, body.max_hit_points, body.current_hit_points,
        body.hit_dice_total, body.armor_class, body.initiative_bonus, body.speed,
        body.proficiency_bonus, body.passive_perception, body.personality_traits,
        body.ideals, body.bonds, body.flaws, body.backstory, body.notes,
        body.campaign_id ?? null,
      ],
    );

    res.status(201).json({ id, created_at: now });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await queryOne(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (!existing) throw new ApiError(404, 'Character not found');

    const updates = CharacterUpsertSchema.partial().parse(req.body);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    const jsonFields = new Set(['classes', 'ability_scores']);

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${p}`);
        params.push(jsonFields.has(key) ? JSON.stringify(value) : value);
        p++;
      }
    }

    if (setClauses.length === 0) {
      res.json({ id: req.params['id'] });
      return;
    }

    params.push(req.params['id']);
    await query(
      `UPDATE characters SET ${setClauses.join(', ')} WHERE id = $${p}`,
      params,
    );

    res.json({ id: req.params['id'] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM characters WHERE id = $1 AND user_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (result.rowCount === 0) throw new ApiError(404, 'Character not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/slots', requireAuth, async (req, res, next) => {
  try {
    const { level, used } = z.object({ level: z.number().int().min(1).max(9), used: z.number().int().min(0) }).parse(req.body);
    const char = await queryOne<{ spell_slots: { level: number; total: number; used: number }[] }>(
      'SELECT spell_slots FROM characters WHERE id = $1 AND user_id = $2',
      [req.params['id'], req.user!.id],
    );
    if (!char) throw new ApiError(404, 'Character not found');

    const slots = (char.spell_slots ?? []).map((s: { level: number; total: number; used: number }) =>
      s.level === level ? { ...s, used } : s,
    );
    await query('UPDATE characters SET spell_slots = $1 WHERE id = $2', [JSON.stringify(slots), req.params['id']]);
    res.json({ spell_slots: slots });
  } catch (err) {
    next(err);
  }
});

export { router as charactersRouter };


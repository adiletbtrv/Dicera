import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const DiceRollSchema = z.object({
  expression: z.string().min(1).max(100),
  label: z.string().max(100).optional(),
  campaign_id: z.string().uuid().optional(),
});

export const DICE_REGEX = /^(\d+)d(\d+)([+-]\d+)?$/i;
export const MULTI_DICE_REGEX = /(\d+)d(\d+)/gi;

export interface RollResult {
  expression: string;
  total: number;
  rolls: Array<{ die: number; value: number }>;
  modifier: number;
  breakdown: string;
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function parseSingleExpression(expr: string): RollResult | null {
  const trimmed = expr.trim();
  const match = DICE_REGEX.exec(trimmed);
  if (!match) {
    const num = parseInt(trimmed);
    if (!isNaN(num)) {
      return { expression: trimmed, total: num, rolls: [], modifier: num, breakdown: String(num) };
    }
    return null;
  }

  const count = parseInt(match[1] ?? '1');
  const sides = parseInt(match[2] ?? '6');
  const modStr = match[3] ?? '';
  const modifier = modStr ? parseInt(modStr) : 0;

  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;

  const rolls: Array<{ die: number; value: number }> = [];
  for (let i = 0; i < count; i++) {
    rolls.push({ die: sides, value: rollDie(sides) });
  }

  const diceSum = rolls.reduce((sum, r) => sum + r.value, 0);
  const total = diceSum + modifier;
  const rollsList = rolls.map((r) => r.value).join(', ');
  const breakdown = modifier !== 0
    ? `[${rollsList}]${modifier > 0 ? '+' : ''}${modifier} = ${total}`
    : `[${rollsList}] = ${total}`;

  return { expression: trimmed, total, rolls, modifier, breakdown };
}

export function parseComplexExpression(expr: string): RollResult {
  const parts = expr.split(/(?=[+-])/);
  const allRolls: Array<{ die: number; value: number }> = [];
  let total = 0;
  const breakdowns: string[] = [];

  for (const part of parts) {
    const trimmedPart = part.replace(/\s/g, '');
    const isNegative = trimmedPart.startsWith('-');
    const cleanPart = trimmedPart.replace(/^[+-]/, '');
    const result = parseSingleExpression(cleanPart);

    if (!result) continue;

    const sign = isNegative ? -1 : 1;
    total += result.total * sign;
    allRolls.push(...result.rolls);
    breakdowns.push((isNegative ? '-' : '') + result.breakdown);
  }

  return {
    expression: expr,
    total,
    rolls: allRolls,
    modifier: 0,
    breakdown: breakdowns.join(' '),
  };
}

export function parseExpression(expr: string): RollResult {
  const cleanExpr = expr.trim().toLowerCase();

  if (DICE_REGEX.test(cleanExpr)) {
    return parseSingleExpression(cleanExpr) ?? parseComplexExpression(cleanExpr);
  }

  if (MULTI_DICE_REGEX.test(cleanExpr)) {
    return parseComplexExpression(cleanExpr);
  }

  return parseSingleExpression(cleanExpr) ?? {
    expression: cleanExpr,
    total: 0,
    rolls: [],
    modifier: 0,
    breakdown: 'Invalid expression',
  };
}

router.post('/roll', optionalAuth, async (req, res, next) => {
  try {
    const body = DiceRollSchema.parse(req.body);
    const result = parseExpression(body.expression);

    if (result.breakdown === 'Invalid expression') {
      throw new ApiError(400, `Invalid dice expression: "${body.expression}"`);
    }

    if (req.user) {
      await query(
        `INSERT INTO dice_roll_history (id, user_id, campaign_id, expression, result, rolls, modifier, label)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          uuidv4(), req.user.id, body.campaign_id ?? null,
          body.expression, result.total, JSON.stringify(result.rolls),
          result.modifier, body.label ?? null,
        ],
      ).catch(() => null);
    }

    res.json({ ...result, label: body.label });
  } catch (err) {
    next(err);
  }
});

router.get('/history', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.json([]);
      return;
    }

    const rows = await query(
      `SELECT id, expression, result, rolls, modifier, label, campaign_id, created_at
       FROM dice_roll_history WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id],
    );
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

export { router as diceRouter };

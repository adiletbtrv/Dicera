import { z } from 'zod';

export const AbilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
});

export const MonsterSizeSchema = z.enum([
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'gargantuan',
]);

export const AlignmentSchema = z.enum([
  'lawful good',
  'neutral good',
  'chaotic good',
  'lawful neutral',
  'true neutral',
  'chaotic neutral',
  'lawful evil',
  'neutral evil',
  'chaotic evil',
  'unaligned',
  'any',
  'any alignment',
  'any chaotic alignment',
  'any evil alignment',
  'any good alignment',
  'any lawful alignment',
  'any non-good alignment',
  'any non-lawful alignment',
]);

export const ActionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().int().optional(),
  damage_dice: z.string().optional(),
  damage_bonus: z.number().int().optional(),
  damage_type: z.string().optional(),
});

export const SpeedSchema = z.object({
  walk: z.number().int().optional(),
  fly: z.number().int().optional(),
  swim: z.number().int().optional(),
  climb: z.number().int().optional(),
  burrow: z.number().int().optional(),
  hover: z.boolean().optional(),
});

export const MonsterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  size: MonsterSizeSchema,
  type: z.string(),
  subtype: z.string().optional(),
  alignment: AlignmentSchema,
  armor_class: z.number().int(),
  armor_desc: z.string().optional(),
  hit_points: z.number().int(),
  hit_dice: z.string(),
  speed: SpeedSchema,
  ability_scores: AbilityScoresSchema,
  saving_throws: z.record(z.string(), z.number().int()).optional(),
  skills: z.record(z.string(), z.number().int()).optional(),
  damage_vulnerabilities: z.array(z.string()).default([]),
  damage_resistances: z.array(z.string()).default([]),
  damage_immunities: z.array(z.string()).default([]),
  condition_immunities: z.array(z.string()).default([]),
  senses: z.record(z.string(), z.union([z.string(), z.number()])),
  languages: z.string(),
  challenge_rating: z.union([z.number(), z.string()]),
  proficiency_bonus: z.number().int(),
  xp: z.number().int(),
  special_abilities: z.array(ActionSchema).default([]),
  actions: z.array(ActionSchema).default([]),
  bonus_actions: z.array(ActionSchema).default([]),
  reactions: z.array(ActionSchema).default([]),
  legendary_actions: z.array(ActionSchema).default([]),
  lair_actions: z.array(ActionSchema).default([]),
  mythic_actions: z.array(ActionSchema).default([]),
  description: z.string().optional(),
  source: z.string(),
  page: z.number().int().optional(),
  environments: z.array(z.string()).default([]),
  image_url: z.string().url().optional(),
});

export type Monster = z.infer<typeof MonsterSchema>;
export type MonsterSize = z.infer<typeof MonsterSizeSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type Action = z.infer<typeof ActionSchema>;

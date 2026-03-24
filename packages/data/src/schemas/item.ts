import { z } from 'zod';

export const ItemRaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'unknown',
]);

export const ItemCategorySchema = z.enum([
  'armor',
  'weapon',
  'potion',
  'ring',
  'rod',
  'scroll',
  'staff',
  'wand',
  'wondrous item',
  'ammunition',
  'adventuring gear',
  'tool',
  'mount',
  'vehicle',
  'trade good',
]);

export const WeaponPropertySchema = z.enum([
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'range',
  'reach',
  'special',
  'thrown',
  'two-handed',
  'versatile',
  'silvered',
  'adamantine',
]);

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: ItemCategorySchema,
  rarity: ItemRaritySchema,
  requires_attunement: z.boolean().default(false),
  attunement_desc: z.string().optional(),
  weight: z.number().min(0).optional(),
  cost: z
    .object({
      quantity: z.number().int().min(0),
      unit: z.enum(['cp', 'sp', 'ep', 'gp', 'pp']),
    })
    .optional(),
  description: z.string(),
  properties: z.array(WeaponPropertySchema).optional(),
  damage: z
    .object({
      damage_dice: z.string(),
      damage_type: z.string(),
    })
    .optional(),
  armor_class: z
    .object({
      base: z.number().int(),
      dex_bonus: z.boolean(),
      max_bonus: z.number().int().optional(),
    })
    .optional(),
  range: z
    .object({
      normal: z.number().int(),
      long: z.number().int().optional(),
    })
    .optional(),
  magic_bonus: z.number().int().optional(),
  source: z.string(),
  page: z.number().int().optional(),
  homebrew: z.boolean().default(false),
  homebrew_creator_id: z.string().optional(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemRarity = z.infer<typeof ItemRaritySchema>;
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

import { z } from 'zod';

export const AbilityScoreKeySchema = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']);

export const ClassLevelSchema = z.object({
  class_id: z.string(),
  class_name: z.string(),
  level: z.number().int().min(1).max(20),
  subclass_id: z.string().optional(),
  subclass_name: z.string().optional(),
});

export const EquipmentItemSchema = z.object({
  item_id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(0).default(1),
  equipped: z.boolean().default(false),
  attuned: z.boolean().default(false),
  notes: z.string().optional(),
});

export const SpellSlotSchema = z.object({
  level: z.number().int().min(1).max(9),
  total: z.number().int().min(0),
  used: z.number().int().min(0),
});

export const CharacterSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1).max(100),
  race_id: z.string(),
  race_name: z.string(),
  subrace_id: z.string().optional(),
  subrace_name: z.string().optional(),
  background_id: z.string(),
  background_name: z.string(),
  alignment: z.string(),
  experience_points: z.number().int().min(0).default(0),
  classes: z.array(ClassLevelSchema).min(1),
  total_level: z.number().int().min(1).max(20),
  ability_scores: z.object({
    str: z.number().int().min(1).max(30),
    dex: z.number().int().min(1).max(30),
    con: z.number().int().min(1).max(30),
    int: z.number().int().min(1).max(30),
    wis: z.number().int().min(1).max(30),
    cha: z.number().int().min(1).max(30),
  }),
  saving_throw_proficiencies: z.array(AbilityScoreKeySchema).default([]),
  skill_proficiencies: z.array(z.string()).default([]),
  skill_expertises: z.array(z.string()).default([]),
  max_hit_points: z.number().int().min(1),
  current_hit_points: z.number().int(),
  temporary_hit_points: z.number().int().min(0).default(0),
  hit_dice_total: z.string(),
  hit_dice_used: z.number().int().min(0).default(0),
  death_save_successes: z.number().int().min(0).max(3).default(0),
  death_save_failures: z.number().int().min(0).max(3).default(0),
  armor_class: z.number().int().min(1),
  initiative_bonus: z.number().int(),
  speed: z.number().int().min(0),
  proficiency_bonus: z.number().int().min(2).max(6),
  passive_perception: z.number().int(),
  inspiration: z.boolean().default(false),
  feat_ids: z.array(z.string()).default([]),
  equipment: z.array(EquipmentItemSchema).default([]),
  copper: z.number().int().min(0).default(0),
  silver: z.number().int().min(0).default(0),
  electrum: z.number().int().min(0).default(0),
  gold: z.number().int().min(0).default(0),
  platinum: z.number().int().min(0).default(0),
  prepared_spell_ids: z.array(z.string()).default([]),
  known_spell_ids: z.array(z.string()).default([]),
  spell_slots: z.array(SpellSlotSchema).default([]),
  languages: z.array(z.string()).default([]),
  personality_traits: z.string().default(''),
  ideals: z.string().default(''),
  bonds: z.string().default(''),
  flaws: z.string().default(''),
  backstory: z.string().default(''),
  appearance: z.string().default(''),
  notes: z.string().default(''),
  image_url: z.string().url().optional(),
  campaign_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type ClassLevel = z.infer<typeof ClassLevelSchema>;
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

import { z } from 'zod';

export const ClassFeatureSchema = z.object({
  name: z.string(),
  level: z.number().int().min(1).max(20),
  description: z.string(),
  is_subclass_feature: z.boolean().default(false),
});

export const SubclassSchema = z.object({
  id: z.string(),
  class_id: z.string(),
  name: z.string(),
  flavor_name: z.string().optional(),
  description: z.string(),
  source: z.string(),
  features: z.array(ClassFeatureSchema).default([]),
});

export const SpellcastingSchema = z.object({
  ability: z.enum(['int', 'wis', 'cha']),
  type: z.enum(['full', 'half', 'third', 'pact', 'none']),
  spell_list: z.string(),
  known_spells_formula: z.string().optional(),
  prepared_spells_formula: z.string().optional(),
  cantrips_known: z.array(z.number()).optional(),
  spells_known: z.array(z.number()).optional(),
});

export const ClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  hit_die: z.enum(['d6', 'd8', 'd10', 'd12']),
  description: z.string(),
  primary_ability: z.array(z.string()),
  saving_throw_proficiencies: z.array(z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha'])),
  armor_proficiencies: z.array(z.string()),
  weapon_proficiencies: z.array(z.string()),
  tool_proficiencies: z.array(z.string()).default([]),
  skill_choices: z.object({
    count: z.number().int(),
    from: z.array(z.string()),
  }),
  starting_equipment: z.array(z.string()).default([]),
  spellcasting: SpellcastingSchema.optional(),
  subclass_level: z.number().int().default(3),
  subclass_flavor: z.string().default('Subclass'),
  features: z.array(ClassFeatureSchema).default([]),
  subclasses: z.array(SubclassSchema).default([]),
  source: z.string(),
  page: z.number().int().optional(),
});

export const RaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.enum(['tiny', 'small', 'medium', 'large']),
  speed: z.number().int(),
  ability_score_increases: z.record(z.string(), z.number().int()),
  age_desc: z.string().default(''),
  alignment_desc: z.string().default(''),
  size_desc: z.string().default(''),
  languages: z.array(z.string()).default([]),
  language_desc: z.string().default(''),
  traits: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  subraces: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        ability_score_increases: z.record(z.string(), z.number().int()),
        traits: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
          }),
        ),
      }),
    )
    .default([]),
  source: z.string(),
  page: z.number().int().optional(),
});

export const BackgroundSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  skill_proficiencies: z.array(z.string()),
  tool_proficiencies: z.array(z.string()).default([]),
  languages: z.number().int().default(0),
  starting_equipment: z.array(z.string()).default([]),
  starting_gold: z.number().int().default(0),
  feature_name: z.string(),
  feature_description: z.string(),
  personality_traits: z.array(z.string()).default([]),
  ideals: z.array(z.string()).default([]),
  bonds: z.array(z.string()).default([]),
  flaws: z.array(z.string()).default([]),
  source: z.string(),
  page: z.number().int().optional(),
});

export type DndClass = z.infer<typeof ClassSchema>;
export type Subclass = z.infer<typeof SubclassSchema>;
export type Race = z.infer<typeof RaceSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type ClassFeature = z.infer<typeof ClassFeatureSchema>;

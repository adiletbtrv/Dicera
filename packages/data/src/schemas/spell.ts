import { z } from 'zod';

export const SpellSchoolSchema = z.enum([
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
]);

export const SpellComponentSchema = z.object({
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  materials_desc: z.string().optional(),
});

export const SpellSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  level: z.number().int().min(0).max(9),
  school: SpellSchoolSchema,
  casting_time: z.string(),
  range: z.string(),
  components: SpellComponentSchema,
  duration: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  description: z.string(),
  higher_levels: z.string().optional(),
  classes: z.array(z.string()),
  subclasses: z.array(z.string()).optional(),
  source: z.string(),
  page: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
});

export type Spell = z.infer<typeof SpellSchema>;
export type SpellSchool = z.infer<typeof SpellSchoolSchema>;

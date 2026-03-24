import { z } from 'zod';

export const HomebrewTypeSchema = z.enum([
  'spell',
  'monster',
  'item',
  'class',
  'subclass',
  'race',
  'subrace',
  'background',
  'feat',
  'rule',
]);

export const HomebrewStatusSchema = z.enum(['draft', 'published', 'archived']);

export const HomebrewSchema = z.object({
  id: z.string(),
  creator_id: z.string(),
  type: HomebrewTypeSchema,
  status: HomebrewStatusSchema.default('draft'),
  name: z.string().min(1).max(200),
  description: z.string().default(''),
  content: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  likes: z.number().int().min(0).default(0),
  views: z.number().int().min(0).default(0),
  version: z.string().default('1.0'),
  parent_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Homebrew = z.infer<typeof HomebrewSchema>;
export type HomebrewType = z.infer<typeof HomebrewTypeSchema>;

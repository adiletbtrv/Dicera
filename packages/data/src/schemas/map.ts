import { z } from 'zod';

export const TokenSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']).default('medium'),
  color: z.string().default('#ff0000'),
  image_url: z.string().url().optional(),
  monster_id: z.string().optional(),
  character_id: z.string().optional(),
  npc_id: z.string().optional(),
  hp: z.number().int().optional(),
  max_hp: z.number().int().optional(),
  conditions: z.array(z.string()).default([]),
  initiative: z.number().int().optional(),
  is_hidden: z.boolean().default(false),
  notes: z.string().optional(),
});

export const MapAnnotationSchema = z.object({
  id: z.string(),
  type: z.enum(['pin', 'text', 'shape', 'fog']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  is_hidden: z.boolean().default(false),
});

export const MapSchema = z.object({
  id: z.string(),
  campaign_id: z.string().optional(),
  creator_id: z.string(),
  name: z.string().min(1),
  image_url: z.string(),
  width_px: z.number().int(),
  height_px: z.number().int(),
  grid_size_px: z.number().int().default(50),
  grid_enabled: z.boolean().default(true),
  fog_of_war_enabled: z.boolean().default(false),
  fog_revealed_cells: z.array(z.tuple([z.number(), z.number()])).default([]),
  tokens: z.array(TokenSchema).default([]),
  annotations: z.array(MapAnnotationSchema).default([]),
  notes: z.string().default(''),
  is_public: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type MapData = z.infer<typeof MapSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type MapAnnotation = z.infer<typeof MapAnnotationSchema>;

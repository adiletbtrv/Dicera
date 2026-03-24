import { z } from 'zod';

export const NpcSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  name: z.string().min(1),
  race: z.string().optional(),
  occupation: z.string().optional(),
  location_id: z.string().optional(),
  alignment: z.string().optional(),
  description: z.string().default(''),
  personality: z.string().default(''),
  motivations: z.string().default(''),
  secrets: z.string().default(''),
  notes: z.string().default(''),
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  monster_stat_block_id: z.string().optional(),
  is_alive: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const LocationSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  name: z.string().min(1),
  type: z
    .enum([
      'world',
      'continent',
      'region',
      'country',
      'city',
      'town',
      'village',
      'dungeon',
      'building',
      'poi',
      'other',
    ])
    .default('other'),
  parent_location_id: z.string().optional(),
  description: z.string().default(''),
  notes: z.string().default(''),
  map_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const SessionNoteSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  session_number: z.number().int().min(1),
  title: z.string().min(1),
  date_played: z.string().date().optional(),
  summary: z.string().default(''),
  notes: z.string().default(''),
  xp_awarded: z.number().int().min(0).default(0),
  loot_notes: z.string().default(''),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CampaignSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().default(''),
  setting: z.string().default(''),
  system: z.string().default('D&D 5e'),
  status: z.enum(['active', 'hiatus', 'completed', 'archived']).default('active'),
  player_ids: z.array(z.string()).default([]),
  character_ids: z.array(z.string()).default([]),
  image_url: z.string().url().optional(),
  is_public: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type Npc = z.infer<typeof NpcSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type SessionNote = z.infer<typeof SessionNoteSchema>;

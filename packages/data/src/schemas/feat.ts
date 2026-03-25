import { z } from 'zod';

export const FeatSchema = z.object({
  id: z.string(),
  name: z.string(),
  prerequisite: z.string().optional(),
  description: z.string(),
  source: z.string(),
  page: z.number().int().optional(),
});

export type Feat = z.infer<typeof FeatSchema>;

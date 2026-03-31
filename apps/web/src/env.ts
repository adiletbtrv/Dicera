import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3001/api'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Invalid frontend environment variables:', parsed.error.format());
  throw new Error('Invalid frontend environment variables');
}

export const env = parsed.data;

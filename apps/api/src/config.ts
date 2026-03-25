import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.coerce.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().min(1),
  jwtSecret: z.string().min(32),
  jwtExpiry: z.string().default('7d'),
  corsOrigin: z.string().default('http://localhost:3000'),
  ai: z.object({
    provider: z.enum(['openai', 'huggingface', 'gemini']).default('gemini'),
    openaiApiKey: z.string().optional(),
    huggingfaceApiKey: z.string().optional(),
    geminiApiKey: z.string().optional(),
    defaultModel: z.string().default('gemini-1.5-flash'),
    embeddingModel: z.string().default('text-embedding-004'),
    maxRequestsPerMinute: z.coerce.number().default(5),
    maxRequestsPerDay: z.coerce.number().default(50),
  }),
});

type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    port: process.env['PORT'],
    nodeEnv: process.env['NODE_ENV'],
    databaseUrl: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/dnd_platform',
    jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret-key-replace-in-production-32+',
    jwtExpiry: process.env['JWT_EXPIRY'],
    corsOrigin: process.env['CORS_ORIGIN'],
    ai: {
      provider: process.env['AI_PROVIDER'],
      openaiApiKey: process.env['OPENAI_API_KEY'],
      huggingfaceApiKey: process.env['HUGGINGFACE_API_KEY'],
      geminiApiKey: process.env['GEMINI_API_KEY'],
      defaultModel: process.env['AI_DEFAULT_MODEL'],
      embeddingModel: process.env['AI_EMBEDDING_MODEL'],
      maxRequestsPerMinute: process.env['AI_MAX_REQUESTS_PER_MINUTE'],
      maxRequestsPerDay: process.env['AI_MAX_REQUESTS_PER_DAY'],
    },
  });

  if (!result.success) {
    console.error('Configuration error:', result.error.message);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();

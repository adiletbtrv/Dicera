import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';
import { config } from '../config.js';
import {
  OpenAiProvider,
  HuggingFaceProvider,
  GeminiProvider,
  RulesRag,
  NpcBot,
  StoryBot,
  DmAssistant,
  RateLimiter,
  PgVectorStore,
  type LlmProvider,
  type ChatMessage,
} from '@dnd/ai';

const router = Router();

function createProvider(): LlmProvider {
  if (config.ai.provider === 'huggingface' && config.ai.huggingfaceApiKey) {
    return new HuggingFaceProvider({ apiKey: config.ai.huggingfaceApiKey });
  }
  if (config.ai.provider === 'gemini' && config.ai.geminiApiKey) {
    return new GeminiProvider({
      apiKey: config.ai.geminiApiKey,
      defaultModel: config.ai.defaultModel,
      embeddingModel: config.ai.embeddingModel,
    });
  }
  if (config.ai.openaiApiKey) {
    return new OpenAiProvider({
      apiKey: config.ai.openaiApiKey,
      defaultModel: config.ai.defaultModel,
      embeddingModel: config.ai.embeddingModel,
    });
  }
  throw new Error('No AI provider configured. Set OPENAI_API_KEY, HUGGINGFACE_API_KEY, or GEMINI_API_KEY.');
}

let provider: LlmProvider;
try {
  provider = createProvider();
} catch {
  console.warn('AI provider not configured. AI routes will return 503.');
}

import { query, queryOne } from '../db/client.js';

async function checkRateLimitDB(userId: string) {
  const rs = await query(
    `INSERT INTO rate_limits (user_id, minute_count, minute_reset, day_count, day_tokens, day_reset)
     VALUES ($1, 0, NOW() + INTERVAL '1 minute', 0, 0, NOW() + INTERVAL '1 day')
     ON CONFLICT (user_id) DO UPDATE SET
       minute_count = CASE WHEN rate_limits.minute_reset <= NOW() THEN 0 ELSE rate_limits.minute_count END,
       minute_reset = CASE WHEN rate_limits.minute_reset <= NOW() THEN NOW() + INTERVAL '1 minute' ELSE rate_limits.minute_reset END,
       day_count = CASE WHEN rate_limits.day_reset <= NOW() THEN 0 ELSE rate_limits.day_count END,
       day_tokens = CASE WHEN rate_limits.day_reset <= NOW() THEN 0 ELSE rate_limits.day_tokens END,
       day_reset = CASE WHEN rate_limits.day_reset <= NOW() THEN NOW() + INTERVAL '1 day' ELSE rate_limits.day_reset END
     RETURNING *`,
    [userId]
  );
  const row = rs.rows[0];
  if (!row) return;
  if (row.minute_count >= config.ai.maxRequestsPerMinute) {
    throw new ApiError(429, 'Rate limit exceeded. Please wait a moment.');
  }
  if (row.day_count >= config.ai.maxRequestsPerDay) {
    throw new ApiError(429, 'Daily AI request limit reached.');
  }
}

async function recordRateLimitDB(userId: string, tokens: number = 0) {
  await query(
    `UPDATE rate_limits SET 
       minute_count = minute_count + 1,
       day_count = day_count + 1,
       day_tokens = day_tokens + $2
     WHERE user_id = $1`,
    [userId, tokens]
  );
}

function checkProvider() {
  if (!provider) throw new ApiError(503, 'AI service is not configured on this server.');
}

// Safety wrapper to catch upstream provider errors (like Gemini 429 Quota Exceeded)
async function safeAiCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err: any) {
    const msg = err?.message?.toLowerCase() || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      throw new ApiError(429, 'AI Provider rate limit exceeded. Please wait a moment before trying again.');
    }
    throw new ApiError(503, `AI Provider Error: ${err?.message || 'Unknown error'}`);
  }
}

const ChatHistorySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).default([]),
});

router.post('/rules', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { question } = z.object({ question: z.string().min(1).max(1000) }).parse(req.body);
    let result = { answer: '', sources: [] as any[] };

    try {
      const vectorStore = new PgVectorStore(config.databaseUrl);
      const rag = new RulesRag(provider, vectorStore);
      result = await rag.query(question);
    } catch (dbError) {
      console.warn('Vector store unavailable, falling back to base model', dbError);

      const fallbackPrompt = `You are a D&D 5e Rules Expert. Answer this strictly by the rules: ${question}`;
      const resModel = await safeAiCall(() => provider.chat([{ role: 'user', content: fallbackPrompt }]));
      result.answer = resModel.content;
      result.sources = [];
    }

    await recordRateLimitDB(req.user!.id);
    res.json({ answer: result.answer, model: 'rag-engine', sources: result.sources });

  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new ApiError(400, 'Invalid request payload format.'));
    } else {
      next(err);
    }
  }
});

router.post('/npc/dialogue', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const schema = z.object({
      persona: z.object({
        name: z.string(),
        race: z.string().optional(),
        occupation: z.string().optional(),
        personality: z.string(),
        motivations: z.string().optional(),
        secrets: z.string().optional(),
        speakingStyle: z.string().optional(),
        relationshipToParty: z.string().optional(),
        campaignContext: z.string().optional(),
      }),
      message: z.string().min(1).max(500),
      history: ChatHistorySchema.shape.messages,
    });

    const body = schema.parse(req.body);
    const bot = new NpcBot(provider);

    const history: ChatMessage[] = body.history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await safeAiCall(() => bot.generateDialogue(body.persona as Parameters<NpcBot['generateDialogue']>[0], body.message, history));
    await recordRateLimitDB(req.user!.id, response.usage?.total_tokens);

    res.json({ reply: response.content, model: response.model });
  } catch (err) {
    next(err);
  }
});

router.post('/npc/impression', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { persona } = z.object({
      persona: z.object({
        name: z.string(),
        race: z.string().optional(),
        occupation: z.string().optional(),
        personality: z.string(),
      }),
    }).parse(req.body);

    const bot = new NpcBot(provider);
    const impression = await safeAiCall(() => bot.generateFirstImpression(persona as Parameters<NpcBot['generateFirstImpression']>[0]));
    await recordRateLimitDB(req.user!.id);

    res.json({ impression });
  } catch (err) {
    next(err);
  }
});

router.post('/story/hook', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { context } = z.object({
      context: z.object({
        campaignName: z.string(),
        setting: z.string().optional(),
        currentArc: z.string().optional(),
        recentEvents: z.string().optional(),
        playerCharacters: z.array(z.object({
          name: z.string(),
          race: z.string(),
          class: z.string(),
          background: z.string().optional(),
        })).optional(),
        importantNpcs: z.array(z.string()).optional(),
        importantLocations: z.array(z.string()).optional(),
        tone: z.enum(['heroic', 'gritty', 'comedic', 'horror', 'mystery', 'political']).optional(),
      }),
    }).parse(req.body);

    const bot = new StoryBot(provider);
    const hook = await safeAiCall(() => bot.generateSessionHook(context as Parameters<StoryBot['generateSessionHook']>[0]));
    await recordRateLimitDB(req.user!.id);

    res.json({ hook });
  } catch (err) {
    next(err);
  }
});

router.post('/story/location', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { locationName, locationType, context } = z.object({
      locationName: z.string().min(1),
      locationType: z.string().min(1),
      context: z.any().optional(),
    }).parse(req.body);

    const bot = new StoryBot(provider);
    const description = await safeAiCall(() => bot.generateLocationDescription(locationName, locationType, context as Parameters<StoryBot['generateLocationDescription']>[2]));
    await recordRateLimitDB(req.user!.id);

    res.json({ description });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/encounter', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { context } = z.object({
      context: z.object({
        partyLevel: z.number().int().min(1).max(20),
        partySize: z.number().int().min(1).max(8),
        partyComposition: z.array(z.string()).optional(),
        currentLocation: z.string().optional(),
        campaignArc: z.string().optional(),
        desiredDifficulty: z.enum(['easy', 'medium', 'hard', 'deadly']).optional(),
        theme: z.string().optional(),
      }),
    }).parse(req.body);

    const dm = new DmAssistant(provider);
    const suggestion = await safeAiCall(() => dm.suggestEncounter(context as Parameters<DmAssistant['suggestEncounter']>[0]));
    await recordRateLimitDB(req.user!.id);

    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/treasure', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { partyLevel, encounterType, monsterCR } = z.object({
      partyLevel: z.number().int().min(1).max(20),
      encounterType: z.enum(['individual', 'hoard']),
      monsterCR: z.number().optional(),
    }).parse(req.body);

    const dm = new DmAssistant(provider);
    const treasure = await safeAiCall(() => dm.generateTreasure(partyLevel, encounterType, monsterCR));
    await recordRateLimitDB(req.user!.id);

    res.json({ treasure });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/chat', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    await checkRateLimitDB(req.user!.id);

    const { history, message } = z.object({
      history: ChatHistorySchema.shape.messages,
      message: z.string().min(1).max(1000),
    }).parse(req.body);

    const dm = new DmAssistant(provider);
    const response = await safeAiCall(() => dm.chat(
      history.map((m) => ({ role: m.role, content: m.content })),
      message,
    ));
    await recordRateLimitDB(req.user!.id, response.usage?.total_tokens);

    res.json({ reply: response.content, model: response.model });
  } catch (err) {
    next(err);
  }
});

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const rs = await queryOne<{ minute_count: number, day_count: number, day_tokens: number }>(
      'SELECT minute_count, day_count, day_tokens FROM rate_limits WHERE user_id = $1 AND minute_reset > NOW()',
      [req.user!.id]
    );
    res.json({
      available: !!provider,
      provider: config.ai.provider,
      rateLimit: {
        minuteRequestsUsed: rs?.minute_count ?? 0,
        dayRequestsUsed: rs?.day_count ?? 0,
        dayTokensUsed: rs?.day_tokens ?? 0,
        maxPerMinute: config.ai.maxRequestsPerMinute,
        maxPerDay: config.ai.maxRequestsPerDay,
      },
    });
  } catch(err) { next(err); }
});

export { router as aiRouter };
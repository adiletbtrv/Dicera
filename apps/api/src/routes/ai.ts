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

const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: config.ai.maxRequestsPerMinute,
  maxRequestsPerDay: config.ai.maxRequestsPerDay,
});

function checkProvider() {
  if (!provider) throw new ApiError(503, 'AI service is not configured on this server.');
}

function checkRateLimit(userId: string) {
  const check = rateLimiter.check(userId);
  if (!check.allowed) throw new ApiError(429, check.reason ?? 'Rate limit exceeded');
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
    checkRateLimit(req.user!.id);

    const { question } = z.object({ question: z.string().min(1).max(1000) }).parse(req.body);
    let result = { answer: '', sources: [] as any[] };
    
    try {
      const vectorStore = new PgVectorStore(config.databaseUrl);
      const rag = new RulesRag(provider, vectorStore);
      result = await rag.query(question);
    } catch (dbError) {
      console.warn('Vector store unavailable, falling back to base model', dbError);
      const fallbackPrompt = `You are a D&D 5e Rules Expert. Answer this strictly by the rules: ${question}`;
      const res = await provider.chat([{ role: 'user', content: fallbackPrompt }]);
      result.answer = res.content;
      result.sources = [];
    }

    rateLimiter.record(req.user!.id);

    res.json({ answer: result.answer, model: 'rag-engine', sources: result.sources });
  } catch (err) {
    next(err);
  }
});

router.post('/npc/dialogue', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

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

    const response = await bot.generateDialogue(body.persona as any, body.message, history);
    rateLimiter.record(req.user!.id, response.usage?.total_tokens);

    res.json({ reply: response.content, model: response.model });
  } catch (err) {
    next(err);
  }
});

router.post('/npc/impression', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

    const { persona } = z.object({
      persona: z.object({
        name: z.string(),
        race: z.string().optional(),
        occupation: z.string().optional(),
        personality: z.string(),
      }),
    }).parse(req.body);

    const bot = new NpcBot(provider);
    const impression = await bot.generateFirstImpression(persona as any);
    rateLimiter.record(req.user!.id);

    res.json({ impression });
  } catch (err) {
    next(err);
  }
});

router.post('/story/hook', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

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
    const hook = await bot.generateSessionHook(context as any);
    rateLimiter.record(req.user!.id);

    res.json({ hook });
  } catch (err) {
    next(err);
  }
});

router.post('/story/location', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

    const { locationName, locationType, context } = z.object({
      locationName: z.string().min(1),
      locationType: z.string().min(1),
      context: z.any().optional(),
    }).parse(req.body);

    const bot = new StoryBot(provider);
    const description = await bot.generateLocationDescription(locationName, locationType, context);
    rateLimiter.record(req.user!.id);

    res.json({ description });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/encounter', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

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
    const suggestion = await dm.suggestEncounter(context as any);
    rateLimiter.record(req.user!.id);

    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/treasure', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

    const { partyLevel, encounterType, monsterCR } = z.object({
      partyLevel: z.number().int().min(1).max(20),
      encounterType: z.enum(['individual', 'hoard']),
      monsterCR: z.number().optional(),
    }).parse(req.body);

    const dm = new DmAssistant(provider);
    const treasure = await dm.generateTreasure(partyLevel, encounterType, monsterCR);
    rateLimiter.record(req.user!.id);

    res.json({ treasure });
  } catch (err) {
    next(err);
  }
});

router.post('/dm/chat', requireAuth, async (req, res, next) => {
  try {
    checkProvider();
    checkRateLimit(req.user!.id);

    const { history, message } = z.object({
      history: ChatHistorySchema.shape.messages,
      message: z.string().min(1).max(1000),
    }).parse(req.body);

    const dm = new DmAssistant(provider);
    const response = await dm.chat(
      history.map((m) => ({ role: m.role, content: m.content })),
      message,
    );
    rateLimiter.record(req.user!.id, response.usage?.total_tokens);

    res.json({ reply: response.content, model: response.model });
  } catch (err) {
    next(err);
  }
});

router.get('/status', requireAuth, (req, res) => {
  const status = rateLimiter.getStatus(req.user!.id);
  res.json({
    available: !!provider,
    provider: config.ai.provider,
    rateLimit: {
      ...status,
      maxPerMinute: config.ai.maxRequestsPerMinute,
      maxPerDay: config.ai.maxRequestsPerDay,
    },
  });
});

export { router as aiRouter };

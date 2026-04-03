import express from 'express';
import crypto from 'node:crypto';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { authRouter } from './routes/auth.js';
import { spellsRouter } from './routes/spells.js';
import { monstersRouter } from './routes/monsters.js';
import { charactersRouter } from './routes/characters.js';
import { campaignsRouter } from './routes/campaigns.js';
import { encountersRouter } from './routes/encounters.js';
import { diceRouter } from './routes/dice.js';
import { homebrewRouter } from './routes/homebrew.js';
import { mapsRouter } from './routes/maps.js';
import { aiRouter } from './routes/ai.js';
import { racesRouter } from './routes/races.js';
import { classesRouter } from './routes/classes.js';
import { backgroundsRouter } from './routes/backgrounds.js';
import { featsRouter } from './routes/feats.js';
import { conditionsRouter } from './routes/conditions.js';
import { itemsRouter } from './routes/items.js';
import { adminRouter } from './routes/admin.js';
import { notificationsRouter } from './routes/notifications.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(pinoHttp({ logger, genReqId: () => crypto.randomUUID() }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

app.use('/api/auth', authRouter);
app.use('/api/spells', spellsRouter);
app.use('/api/monsters', monstersRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/encounters', encountersRouter);
app.use('/api/dice', diceRouter);
app.use('/api/homebrew', homebrewRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/races', racesRouter);
app.use('/api/classes', classesRouter);
app.use('/api/backgrounds', backgroundsRouter);
app.use('/api/feats', featsRouter);
app.use('/api/conditions', conditionsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

app.use(notFound);
app.use(errorHandler);

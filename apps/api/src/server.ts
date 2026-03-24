import 'dotenv/config';
import { app } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { healthCheck } from './db/client.js';

async function start() {
  await healthCheck();
  app.listen(config.port, () => {
    logger.info(`🐉 Dicera API running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});


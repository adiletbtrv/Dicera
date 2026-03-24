import 'dotenv/config';
import { app } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

app.listen(config.port, () => {
  logger.info(`🐉 Dicera API running on port ${config.port} [${config.nodeEnv}]`);
});

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const sql = readFileSync(join(__dirname, 'migrations', '0003_campaign_members_and_notifications.sql'), 'utf-8');
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Migration done.');
  await pool.end();
}

run().catch(console.error);

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.info('Starting robust database migration...');
  const client = await pool.connect();
  
  try {
    // 1. Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Read applied migrations
    const { rows } = await client.query('SELECT version FROM schema_migrations ORDER BY version ASC');
    const applied = new Set(rows.map(r => r.version));

    // 3. Find migration files
    const migrationsDir = join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    // 4. Execute pending migrations atomically
    let appliedCount = 0;
    for (const file of files) {
      if (!applied.has(file)) {
        console.info(`Applying migration: ${file}`);
        const sql = readFileSync(join(migrationsDir, file), 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          appliedCount++;
          console.info(`✅ Successfully applied ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed at ${file}:`, err);
          throw err;
        }
      }
    }
    console.info(`✅ Migration complete. ${appliedCount} new migrations applied.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});

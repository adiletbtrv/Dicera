import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Retrofit existing schema to tracking table
    const hasUsers = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')`);
    if (hasUsers.rows[0].exists) {
      await client.query(`INSERT INTO schema_migrations (version) VALUES ('0001_initial.sql') ON CONFLICT DO NOTHING`);
    }

    const hasHomebrew = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'homebrew')`);
    if (hasHomebrew.rows[0].exists) {
      await client.query(`INSERT INTO schema_migrations (version) VALUES ('0002_maps_and_homebrew.sql') ON CONFLICT DO NOTHING`);
    }

    const hasCampaignMembers = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_members')`);
    if (hasCampaignMembers.rows[0].exists) {
      await client.query(`INSERT INTO schema_migrations (version) VALUES ('0003_campaign_members_and_notifications.sql') ON CONFLICT DO NOTHING`);
    }

    const { rows } = await client.query('SELECT version FROM schema_migrations ORDER BY version ASC');
    const applied = new Set(rows.map((r) => r.version as string));

    const migrationsDir = join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (!applied.has(file)) {
        console.info(`Applying migration: ${file}`);
        const sql = readFileSync(join(migrationsDir, file), 'utf-8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.info(`Migration applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Migration failed at ${file}:`, err);
          throw err;
        }
      }
    }
  } finally {
    client.release();
  }
}

import 'dotenv/config';
import { pool } from './client.js';

async function fix() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS feats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prerequisite TEXT,
        description TEXT NOT NULL,
        benefits JSONB DEFAULT '[]',
        source TEXT NOT NULL,
        page INTEGER,
        homebrew BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS feats_name_trgm_idx ON feats USING gin(name gin_trgm_ops);
    `);
    console.log('✅ Feats table created.');

    await client.query(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS dm_notes TEXT DEFAULT '';`);
    console.log('✅ dm_notes added to campaigns table.');
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

fix();

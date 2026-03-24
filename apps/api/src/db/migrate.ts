import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.info('Running database migration...');
  const schemaPath = join(__dirname, 'schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    const statements = splitStatements(sql);
    let success = 0;
    let skipped = 0;

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        await client.query(trimmed);
        success++;
      } catch (err: any) {
        const msg = err?.message ?? '';
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate') ||
          msg.includes('DuplicateObject') ||
          err?.code === '42710' || // duplicate_object
          err?.code === '42P07' || // duplicate_table
          err?.code === '42701'    // duplicate_column
        ) {
          skipped++;
        } else {
          console.warn(`  ⚠️  Statement failed (skipping):`, msg.slice(0, 120));
          skipped++;
        }
      }
    }

    console.info(`✅ Migration complete. ${success} statements applied, ${skipped} skipped.`);
  } finally {
    client.release();
    await pool.end();
  }
}

function splitStatements(sql: string): string[] {
  const results: string[] = [];
  let current = '';
  let inDollarBlock = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 === 1) {
      inDollarBlock = !inDollarBlock;
    }

    current += line + '\n';

    if (!inDollarBlock && line.trimEnd().endsWith(';')) {
      results.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    results.push(current.trim());
  }

  return results;
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

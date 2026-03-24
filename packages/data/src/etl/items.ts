import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ItemSchema } from '../schemas/item.js';
import { generateId, dedupeByName } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

export function processItems(inputPath: string, source: string = 'DMG') {
  if (!existsSync(inputPath)) {
    console.warn(`Items source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const items = [];
  const errors: string[] = [];

  for (const rawItem of raw) {
    const withId = { ...rawItem, id: generateId(String(rawItem['name'] ?? ''), source), source };
    const result = ItemSchema.safeParse(withId);
    if (result.success) {
      items.push(result.data);
    } else {
      errors.push(`${String(rawItem['name'])}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} item(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return dedupeByName(items);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sources = [
    { path: join(DATA_DIR, 'raw/items-phb.json'), source: 'PHB' },
    { path: join(DATA_DIR, 'raw/items-dmg.json'), source: 'DMG' },
  ];

  const allItems = sources.flatMap(({ path, source }) => processItems(path, source));
  const unique = dedupeByName(allItems);

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, 'items.json');
  writeFileSync(outPath, JSON.stringify(unique, null, 2));
  console.info(`✅ Wrote ${unique.length} items to ${outPath}`);
}

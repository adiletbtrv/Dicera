import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ItemSchema } from '../schemas/item.js';
import { generateId, dedupeByName } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

const VALID_CATEGORIES = [
  'armor', 'weapon', 'potion', 'ring', 'rod', 'scroll', 'staff', 'wand',
  'wondrous item', 'ammunition', 'adventuring gear', 'tool', 'mount',
  'vehicle', 'trade good'
];

export function processItems(inputPath: string, source: string = 'DMG') {
  if (!existsSync(inputPath)) {
    console.warn(`Items source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const items = [];
  const errors: string[] = [];

  for (const rawItem of raw) {
    // 1. Transform Rarity
    let rarityVal = 'unknown';
    if (typeof rawItem.rarity === 'string') rarityVal = rawItem.rarity.toLowerCase();
    else if (rawItem.rarity && typeof rawItem.rarity === 'object' && 'name' in rawItem.rarity) {
      rarityVal = String(rawItem.rarity.name).toLowerCase();
    }

    // 2. Transform Category
    let catVal = 'wondrous item';
    if (rawItem.equipment_category && typeof rawItem.equipment_category === 'object' && 'index' in rawItem.equipment_category) {
      catVal = String(rawItem.equipment_category.index).toLowerCase().replace(/-/g, ' ');
    } else if (typeof rawItem.category === 'string') {
      catVal = rawItem.category.toLowerCase().replace(/-/g, ' ');
    }

    // Coerce bad categories from SRD into valid schema categories
    if (!VALID_CATEGORIES.includes(catVal)) {
      if (catVal.includes('armor')) catVal = 'armor';
      else if (catVal.includes('weapon')) catVal = 'weapon';
      else if (catVal.includes('wondrous')) catVal = 'wondrous item';
      else if (catVal.includes('potion')) catVal = 'potion';
      else catVal = 'adventuring gear';
    }

    // 3. Transform Description (SRD uses an array of strings under 'desc')
    let descVal = '';
    if (Array.isArray(rawItem.desc)) descVal = rawItem.desc.join('\n');
    else if (typeof rawItem.desc === 'string') descVal = rawItem.desc;
    else if (typeof rawItem.description === 'string') descVal = rawItem.description;

    const withId = {
      ...rawItem,
      id: generateId(String(rawItem['name'] ?? ''), source),
      source,
      rarity: rarityVal,
      category: catVal,
      description: descVal || 'No description provided.',
    };

    const result = ItemSchema.safeParse(withId);
    if (result.success) {
      items.push(result.data);
    } else {
      errors.push(`${String(rawItem['name'])}: ${result.error.issues[0]?.message} at ${result.error.issues[0]?.path.join('.')}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} item(s) failed validation:`);
    errors.slice(0, 10).forEach((e) => console.warn(` - ${e}`));
    if (errors.length > 10) console.warn(`   ...and ${errors.length - 10} more.`);
  }

  return dedupeByName(items);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sources = [
    { path: join(DATA_DIR, 'raw/items-phb.json'), source: 'PHB' },
    { path: join(DATA_DIR, 'raw/items-dmg.json'), source: 'DMG' },
    { path: join(DATA_DIR, 'raw/magic-items.json'), source: 'DMG' },
  ];

  const allItems = sources.flatMap(({ path, source }) => processItems(path, source));
  const unique = dedupeByName(allItems);

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, 'items.json');
  writeFileSync(outPath, JSON.stringify(unique, null, 2));
  console.info(`✅ Wrote ${unique.length} items to ${outPath}`);
}
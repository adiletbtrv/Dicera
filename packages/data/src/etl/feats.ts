import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FeatSchema } from '../schemas/feat.js';
import { generateId } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

export function processFeats(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Feats source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const feats = [];
  const errors: string[] = [];

  for (const rawFeat of raw) {
    // Parse prerequisites into a string "STR 13" etc
    let prerequisite = '';
    const prereqs = rawFeat['prerequisites'] as any[];
    if (Array.isArray(prereqs) && prereqs.length > 0) {
      const p = prereqs[0];
      if (p && p.ability_score && p.minimum_score) {
        prerequisite = `${p.ability_score.name} ${p.minimum_score}`;
      }
    }

    const description = Array.isArray(rawFeat['desc']) ? rawFeat['desc'].join('\n') : String(rawFeat['desc'] || '');

    const withId = {
      id: generateId(String(rawFeat['name'] ?? ''), source),
      name: String(rawFeat['name'] ?? ''),
      prerequisite: prerequisite || undefined,
      description,
      source,
    };

    const result = FeatSchema.safeParse(withId);
    if (result.success) {
      feats.push(result.data);
    } else {
      errors.push(`${String(rawFeat['name'])}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} feat(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return feats;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT_DIR, { recursive: true });
  const feats = processFeats(join(DATA_DIR, 'raw/feats.json'));
  writeFileSync(join(OUT_DIR, 'feats.json'), JSON.stringify(feats, null, 2));
  console.info(`✅ Wrote ${feats.length} feats`);
}

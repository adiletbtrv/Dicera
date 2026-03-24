import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ClassSchema, RaceSchema, BackgroundSchema } from '../schemas/class.js';
import { generateId } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

export function processClasses(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Classes source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const classes = [];
  const errors: string[] = [];

  for (const rawClass of raw) {
    const withId = { ...rawClass, id: generateId(String(rawClass['name'] ?? ''), source), source };
    const result = ClassSchema.safeParse(withId);
    if (result.success) {
      classes.push(result.data);
    } else {
      errors.push(`${String(rawClass['name'])}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} class(es) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return classes;
}

export function processRaces(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Races source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const races = [];
  const errors: string[] = [];

  for (const rawRace of raw) {
    const withId = { ...rawRace, id: generateId(String(rawRace['name'] ?? ''), source), source };
    const result = RaceSchema.safeParse(withId);
    if (result.success) {
      races.push(result.data);
    } else {
      errors.push(`${String(rawRace['name'])}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} race(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return races;
}

export function processBackgrounds(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Backgrounds source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
  const backgrounds = [];
  const errors: string[] = [];

  for (const rawBg of raw) {
    const withId = { ...rawBg, id: generateId(String(rawBg['name'] ?? ''), source), source };
    const result = BackgroundSchema.safeParse(withId);
    if (result.success) {
      backgrounds.push(result.data);
    } else {
      errors.push(`${String(rawBg['name'])}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} background(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return backgrounds;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT_DIR, { recursive: true });

  const classes = processClasses(join(DATA_DIR, 'raw/classes.json'));
  writeFileSync(join(OUT_DIR, 'classes.json'), JSON.stringify(classes, null, 2));
  console.info(`✅ Wrote ${classes.length} classes`);

  const races = processRaces(join(DATA_DIR, 'raw/races.json'));
  writeFileSync(join(OUT_DIR, 'races.json'), JSON.stringify(races, null, 2));
  console.info(`✅ Wrote ${races.length} races`);

  const backgrounds = processBackgrounds(join(DATA_DIR, 'raw/backgrounds.json'));
  writeFileSync(join(OUT_DIR, 'backgrounds.json'), JSON.stringify(backgrounds, null, 2));
  console.info(`✅ Wrote ${backgrounds.length} backgrounds`);
}

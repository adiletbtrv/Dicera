import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SpellSchema } from '../schemas/spell.js';
import { generateId, dedupeByName } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

interface RawSpell {
  name: string;
  level: number;
  school: string | { name?: string };
  casting_time?: string;
  castingTime?: string;
  range?: string;
  components?: {
    V?: boolean;
    S?: boolean;
    M?: boolean | string;
    materials_needed?: string;
  };
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  desc?: string;
  description?: string;
  higher_level?: string;
  higher_levels?: string;
  classes?: string[] | Array<{ name: string }>;
  subclasses?: Array<{ name: string }>;
  source?: string;
  page?: number;
}

function normalizeSpell(raw: RawSpell, source: string): ReturnType<typeof SpellSchema.safeParse> {
  const schoolName = typeof raw.school === 'string' ? raw.school : (raw.school?.name ?? 'evocation');
  const school = schoolName.toLowerCase().replace(/^school of /i, '');

  const rawComponents = raw.components ?? {};
  const materialDesc =
    typeof rawComponents.M === 'string'
      ? rawComponents.M
      : (rawComponents.materials_needed ?? undefined);

  const classNames: string[] = Array.isArray(raw.classes)
    ? raw.classes.map((c) => (typeof c === 'string' ? c : c.name))
    : [];

  const subclassNames: string[] = Array.isArray(raw.subclasses)
    ? raw.subclasses.map((s) => s.name)
    : [];

  return SpellSchema.safeParse({
    id: generateId(raw.name, source),
    name: raw.name,
    level: raw.level ?? 0,
    school,
    casting_time: raw.casting_time ?? raw.castingTime ?? '1 action',
    range: raw.range ?? 'Self',
    components: {
      verbal: !!rawComponents.V,
      somatic: !!rawComponents.S,
      material: !!rawComponents.M,
      materials_desc: materialDesc,
    },
    duration: raw.duration ?? 'Instantaneous',
    concentration: raw.concentration ?? false,
    ritual: raw.ritual ?? false,
    description: Array.isArray(raw.desc) ? raw.desc.join('\n\n') : (raw.desc ?? raw.description ?? ''),
    higher_levels: Array.isArray(raw.higher_level) ? raw.higher_level.join('\n') : (raw.higher_level ?? raw.higher_levels ?? undefined),
    classes: classNames,
    subclasses: subclassNames,
    source: raw.source ?? source,
    page: raw.page,
    tags: [],
  });
}

export function processSpells(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Spells source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as RawSpell[];
  const spells = [];
  const errors: string[] = [];

  for (const rawSpell of raw) {
    const result = normalizeSpell(rawSpell, source);
    if (result.success) {
      spells.push(result.data);
    } else {
      errors.push(`${rawSpell.name}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} spell(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return dedupeByName(spells);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sources = [
    { path: join(DATA_DIR, 'raw/spells-phb.json'), source: 'PHB' },
    { path: join(DATA_DIR, 'raw/spells-xge.json'), source: 'XGE' },
    { path: join(DATA_DIR, 'raw/spells-tce.json'), source: 'TCE' },
  ];

  const allSpells = sources.flatMap(({ path, source }) => processSpells(path, source));
  const unique = dedupeByName(allSpells);

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, 'spells.json');
  writeFileSync(outPath, JSON.stringify(unique, null, 2));
  console.info(`✅ Wrote ${unique.length} spells to ${outPath}`);
}

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MonsterSchema } from '../schemas/monster.js';
import { generateId, normalizeCR, crToProficiencyBonus, dedupeByName } from './utils.js';
import { XP_BY_CR } from '../schemas/encounter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

interface RawAction {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage_dice?: string;
  damage_bonus?: number;
  damage_type?: string;
}

interface RawMonster {
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment?: string;
  armor_class?: number | Array<{ value: number; type?: string }>;
  armor_desc?: string;
  hit_points?: number;
  hit_dice?: string;
  speed?: Record<string, number | string> | string;
  strength?: number;
  str?: number;
  dexterity?: number;
  dex?: number;
  constitution?: number;
  con?: number;
  intelligence?: number;
  int?: number;
  wisdom?: number;
  wis?: number;
  charisma?: number;
  cha?: number;
  strength_save?: number | null;
  dexterity_save?: number | null;
  constitution_save?: number | null;
  intelligence_save?: number | null;
  wisdom_save?: number | null;
  charisma_save?: number | null;
  skills?: Record<string, number>;
  damage_vulnerabilities?: string | string[];
  damage_resistances?: string | string[];
  damage_immunities?: string | string[];
  condition_immunities?: string | string[];
  senses?: Record<string, string | number> | string;
  languages?: string;
  challenge_rating?: string | number;
  cr?: string | number;
  special_abilities?: RawAction[];
  actions?: RawAction[];
  bonus_actions?: RawAction[];
  reactions?: RawAction[];
  legendary_actions?: RawAction[];
  lair_actions?: RawAction[];
  mythic_actions?: RawAction[];
  desc?: string;
  description?: string;
  source?: string;
  page?: number;
  environments?: string[];
}

function parseStringList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeMonster(raw: RawMonster, source: string): ReturnType<typeof MonsterSchema.safeParse> {
  const cr = normalizeCR(raw.challenge_rating ?? raw.cr ?? 0);
  const acRaw = raw.armor_class;
  const ac = Array.isArray(acRaw) ? (acRaw[0]?.value ?? 10) : (acRaw ?? 10);

  const speedRaw = raw.speed;
  let speed: Record<string, number | boolean> = {};
  if (typeof speedRaw === 'object' && speedRaw !== null) {
    for (const [key, val] of Object.entries(speedRaw)) {
      if (key === 'hover') {
        speed[key] = Boolean(val);
      } else {
        const num = parseInt(String(val));
        if (!isNaN(num)) speed[key] = num;
      }
    }
  } else if (typeof speedRaw === 'string') {
    const walkMatch = speedRaw.match(/(\d+)\s*ft/);
    if (walkMatch?.[1]) speed['walk'] = parseInt(walkMatch[1]);
  }

  const savingThrows: Record<string, number> = {};
  const saveMap: Record<string, number | null | undefined> = {
    str: raw.strength_save,
    dex: raw.dexterity_save,
    con: raw.constitution_save,
    int: raw.intelligence_save,
    wis: raw.wisdom_save,
    cha: raw.charisma_save,
  };
  for (const [key, val] of Object.entries(saveMap)) {
    if (val !== null && val !== undefined) savingThrows[key] = val;
  }

  const sensesRaw = raw.senses;
  const senses: Record<string, string | number> =
    typeof sensesRaw === 'string'
      ? { passive_perception: sensesRaw }
      : (sensesRaw ?? {});

  return MonsterSchema.safeParse({
    id: generateId(raw.name, source),
    name: raw.name,
    size: raw.size?.toLowerCase() ?? 'medium',
    type: raw.type ?? 'unknown',
    subtype: raw.subtype || undefined,
    alignment: (raw.alignment ?? 'unaligned').toLowerCase(),
    armor_class: ac,
    armor_desc: raw.armor_desc || undefined,
    hit_points: raw.hit_points ?? 1,
    hit_dice: raw.hit_dice ?? '1d8',
    speed,
    ability_scores: {
      str: raw.strength ?? raw.str ?? 10,
      dex: raw.dexterity ?? raw.dex ?? 10,
      con: raw.constitution ?? raw.con ?? 10,
      int: raw.intelligence ?? raw.int ?? 10,
      wis: raw.wisdom ?? raw.wis ?? 10,
      cha: raw.charisma ?? raw.cha ?? 10,
    },
    saving_throws: Object.keys(savingThrows).length ? savingThrows : undefined,
    skills: raw.skills || undefined,
    damage_vulnerabilities: parseStringList(raw.damage_vulnerabilities),
    damage_resistances: parseStringList(raw.damage_resistances),
    damage_immunities: parseStringList(raw.damage_immunities),
    condition_immunities: parseStringList(raw.condition_immunities),
    senses,
    languages: raw.languages ?? 'none',
    challenge_rating: cr,
    proficiency_bonus: crToProficiencyBonus(cr),
    xp: XP_BY_CR[cr] ?? 0,
    special_abilities: raw.special_abilities ?? [],
    actions: raw.actions ?? [],
    bonus_actions: raw.bonus_actions ?? [],
    reactions: raw.reactions ?? [],
    legendary_actions: raw.legendary_actions ?? [],
    lair_actions: raw.lair_actions ?? [],
    mythic_actions: raw.mythic_actions ?? [],
    description: (raw.desc ?? raw.description) || undefined,
    source: raw.source ?? source,
    page: raw.page,
    environments: raw.environments ?? [],
  });
}

export function processMonsters(inputPath: string, source: string = 'MM') {
  if (!existsSync(inputPath)) {
    console.warn(`Monsters source file not found: ${inputPath}. Skipping.`);
    return [];
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as RawMonster[];
  const monsters = [];
  const errors: string[] = [];

  for (const rawMonster of raw) {
    const result = normalizeMonster(rawMonster, source);
    if (result.success) {
      monsters.push(result.data);
    } else {
      errors.push(`${rawMonster.name}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} monster(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return dedupeByName(monsters);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sources = [
    { path: join(DATA_DIR, 'raw/monsters-mm.json'), source: 'MM' },
    { path: join(DATA_DIR, 'raw/monsters-vgm.json'), source: 'VGM' },
    { path: join(DATA_DIR, 'raw/monsters-mtof.json'), source: 'MToF' },
  ];

  const allMonsters = sources.flatMap(({ path, source }) => processMonsters(path, source));
  const unique = dedupeByName(allMonsters);

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, 'monsters.json');
  writeFileSync(outPath, JSON.stringify(unique, null, 2));
  console.info(`✅ Wrote ${unique.length} monsters to ${outPath}`);
}

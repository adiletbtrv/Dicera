import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { PoolClient } from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, transaction } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../../packages/data/output');

async function bulkInsert(client: PoolClient, table: string, columns: string[], rows: unknown[][], conflictSql: string) {
  if (rows.length === 0) return;
  const CHUNK_SIZE = Math.floor(60000 / columns.length);
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const values = [];
    const placeholders = [];
    let p = 1;
    for (const row of chunk) {
      const rowPlaceholders = [];
      for (const val of row) {
        rowPlaceholders.push(`$${p++}`);
        values.push(val);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} ${conflictSql}`;
    await client.query(query, values);
  }
}

async function seedSpells() {
  const path = join(DATA_DIR, 'spells.json');
  if (!existsSync(path)) return console.log('No spells data found to seed.');
  const spells = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${spells.length} spells...`);
  
  await transaction(async (client) => {
    const rows = spells.map((s: any) => [
      s.id, s.name, s.level, s.school, s.casting_time, s.range, JSON.stringify(s.components), s.duration,
      s.concentration, s.ritual, s.description, s.higher_levels || null, s.classes || [], 
      s.subclasses || [], s.source, s.page || null, s.tags || []
    ]);
    const cols = ['id', 'name', 'level', 'school', 'casting_time', 'range', 'components', 'duration', 'concentration', 'ritual', 'description', 'higher_levels', 'classes', 'subclasses', 'source', 'page', 'tags'];
    await bulkInsert(client, 'spells', cols, rows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function seedMonsters() {
  const path = join(DATA_DIR, 'monsters.json');
  if (!existsSync(path)) return console.log('No monsters data found to seed.');
  const monsters = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${monsters.length} monsters...`);
  
  await transaction(async (client) => {
    const rows = monsters.map((m: any) => [
      m.id, m.name, m.size, m.type, m.subtype || null, m.alignment || null, m.armor_class, m.armor_desc || null, 
      m.hit_points, m.hit_dice, JSON.stringify(m.speed), JSON.stringify(m.ability_scores), 
      JSON.stringify(m.saving_throws || {}), JSON.stringify(m.skills || {}), m.damage_vulnerabilities || [], 
      m.damage_resistances || [], m.damage_immunities || [], m.condition_immunities || [], 
      JSON.stringify(m.senses || {}), m.languages || null, m.challenge_rating, m.proficiency_bonus, 
      m.xp || 0, JSON.stringify(m.special_abilities || []), JSON.stringify(m.actions || []), 
      JSON.stringify(m.bonus_actions || []), JSON.stringify(m.reactions || []), 
      JSON.stringify(m.legendary_actions || []), JSON.stringify(m.lair_actions || []), 
      JSON.stringify(m.mythic_actions || []), m.description || null, m.source, m.page || null, 
      m.environments || []
    ]);
    const cols = ['id', 'name', 'size', 'type', 'subtype', 'alignment', 'armor_class', 'armor_desc', 'hit_points', 'hit_dice', 'speed', 'ability_scores', 'saving_throws', 'skills', 'damage_vulnerabilities', 'damage_resistances', 'damage_immunities', 'condition_immunities', 'senses', 'languages', 'challenge_rating', 'proficiency_bonus', 'xp', 'special_abilities', 'actions', 'bonus_actions', 'reactions', 'legendary_actions', 'lair_actions', 'mythic_actions', 'description', 'source', 'page', 'environments'];
    await bulkInsert(client, 'monsters', cols, rows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function seedClasses() {
  const path = join(DATA_DIR, 'classes.json');
  if (!existsSync(path)) return console.log('No classes data found to seed.');
  const classes = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${classes.length} classes...`);
  
  await transaction(async (client) => {
    const classRows = classes.map((c: any) => [
      c.id, c.name, c.hit_die, c.description, c.primary_ability, c.saving_throw_proficiencies,
      c.armor_proficiencies || [], c.weapon_proficiencies || [], c.tool_proficiencies || [],
      JSON.stringify(c.skill_choices), c.starting_equipment || [], 
      c.spellcasting ? JSON.stringify(c.spellcasting) : null,
      c.subclass_level, c.subclass_flavor, JSON.stringify(c.features || []), c.source, c.page || null
    ]);
    const classCols = ['id', 'name', 'hit_die', 'description', 'primary_ability', 'saving_throw_proficiencies', 'armor_proficiencies', 'weapon_proficiencies', 'tool_proficiencies', 'skill_choices', 'starting_equipment', 'spellcasting', 'subclass_level', 'subclass_flavor', 'features', 'source', 'page'];
    await bulkInsert(client, 'classes', classCols, classRows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');

    const subRows: any[][] = [];
    for (const c of classes) {
      for (const sub of c.subclasses || []) {
        subRows.push([
          sub.id, c.id, sub.name, sub.flavor_name || null, sub.description, sub.source, JSON.stringify(sub.features || [])
        ]);
      }
    }
    const subCols = ['id', 'class_id', 'name', 'flavor_name', 'description', 'source', 'features'];
    await bulkInsert(client, 'subclasses', subCols, subRows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function seedRaces() {
  const path = join(DATA_DIR, 'races.json');
  if (!existsSync(path)) return console.log('No races data found to seed.');
  const races = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${races.length} races...`);
  
  await transaction(async (client) => {
    const rows = races.map((r: any) => [
      r.id, r.name, r.size, r.speed, JSON.stringify(r.ability_score_increases || {}),
      JSON.stringify(r.traits || []), JSON.stringify(r.subraces || []), r.languages || [],
      r.source, r.page || null
    ]);
    const cols = ['id', 'name', 'size', 'speed', 'ability_score_increases', 'traits', 'subraces', 'languages', 'source', 'page'];
    await bulkInsert(client, 'races', cols, rows, 'ON CONFLICT (id) DO UPDATE SET traits = EXCLUDED.traits');
  });
}

async function seedBackgrounds() {
  const path = join(DATA_DIR, 'backgrounds.json');
  if (!existsSync(path)) return console.log('No backgrounds data found to seed.');
  const backgrounds = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${backgrounds.length} backgrounds...`);
  
  await transaction(async (client) => {
    const rows = backgrounds.map((b: any) => [
      b.id, b.name, b.description, b.skill_proficiencies, b.tool_proficiencies || [],
      b.languages || 0, b.starting_equipment || [], b.starting_gold || 0,
      b.feature_name, b.feature_description, b.personality_traits || [],
      b.ideals || [], b.bonds || [], b.flaws || [], b.source, b.page || null
    ]);
    const cols = ['id', 'name', 'description', 'skill_proficiencies', 'tool_proficiencies', 'languages', 'starting_equipment', 'starting_gold', 'feature_name', 'feature_description', 'personality_traits', 'ideals', 'bonds', 'flaws', 'source', 'page'];
    await bulkInsert(client, 'backgrounds', cols, rows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function seedItems() {
  const path = join(DATA_DIR, 'items.json');
  if (!existsSync(path)) return console.log('No items data found to seed.');
  const items = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${items.length} items...`);
  
  await transaction(async (client) => {
    const rows = items.map((i: any) => [
      i.id, i.name, i.category, i.rarity || 'common', i.requires_attunement || false,
      i.attunement_desc || null, i.weight || null, i.cost ? JSON.stringify(i.cost) : null,
      i.description, i.properties || [], i.damage ? JSON.stringify(i.damage) : null,
      i.armor_class ? JSON.stringify(i.armor_class) : null, i.range ? JSON.stringify(i.range) : null,
      i.magic_bonus || null, i.source, i.page || null
    ]);
    const cols = ['id', 'name', 'category', 'rarity', 'requires_attunement', 'attunement_desc', 'weight', 'cost', 'description', 'properties', 'damage', 'armor_class', 'range', 'magic_bonus', 'source', 'page'];
    await bulkInsert(client, 'items', cols, rows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function seedFeats() {
  const path = join(DATA_DIR, 'feats.json');
  if (!existsSync(path)) return console.log('No feats data found to seed.');
  const feats = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${feats.length} feats...`);
  
  await transaction(async (client) => {
    const rows = feats.map((f: any) => [
      f.id, f.name, f.prerequisite || null, f.description, f.source, f.page || null
    ]);
    const cols = ['id', 'name', 'prerequisite', 'description', 'source', 'page'];
    await bulkInsert(client, 'feats', cols, rows, 'ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description');
  });
}

async function defaultSeed() {
  try {
    await seedSpells();
    await seedMonsters();
    await seedClasses();
    await seedRaces();
    await seedBackgrounds();
    await seedItems();
    await seedFeats();
    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

defaultSeed();

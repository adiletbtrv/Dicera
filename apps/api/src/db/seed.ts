import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, transaction } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../../packages/data/output');

async function seedSpells() {
  const path = join(DATA_DIR, 'spells.json');
  if (!existsSync(path)) return console.log('No spells data found to seed.');
  const spells = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${spells.length} spells...`);
  
  await transaction(async (client) => {
    for (const s of spells) {
      await client.query(
        `INSERT INTO spells (
          id, name, level, school, casting_time, range, components, duration, 
          concentration, ritual, description, higher_levels, classes, subclasses, source, page, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET 
          description = EXCLUDED.description`,
        [
          s.id, s.name, s.level, s.school, s.casting_time, s.range, JSON.stringify(s.components), s.duration,
          s.concentration, s.ritual, s.description, s.higher_levels || null, s.classes || [], 
          s.subclasses || [], s.source, s.page || null, s.tags || []
        ]
      );
    }
  });
}

async function seedMonsters() {
  const path = join(DATA_DIR, 'monsters.json');
  if (!existsSync(path)) return console.log('No monsters data found to seed.');
  const monsters = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${monsters.length} monsters...`);
  
  await transaction(async (client) => {
    for (const m of monsters) {
      await client.query(
        `INSERT INTO monsters (
          id, name, size, type, subtype, alignment, armor_class, armor_desc, hit_points, hit_dice, 
          speed, ability_scores, saving_throws, skills, damage_vulnerabilities, damage_resistances, 
          damage_immunities, condition_immunities, senses, languages, challenge_rating, proficiency_bonus, 
          xp, special_abilities, actions, bonus_actions, reactions, legendary_actions, lair_actions, 
          mythic_actions, description, source, page, environments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description`,
        [
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
        ]
      );
    }
  });
}

async function seedClasses() {
  const path = join(DATA_DIR, 'classes.json');
  if (!existsSync(path)) return console.log('No classes data found to seed.');
  const classes = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${classes.length} classes...`);
  
  await transaction(async (client) => {
    for (const c of classes) {
      await client.query(
        `INSERT INTO classes (
          id, name, hit_die, description, primary_ability, saving_throw_proficiencies, 
          armor_proficiencies, weapon_proficiencies, tool_proficiencies, skill_choices, 
          starting_equipment, spellcasting, subclass_level, subclass_flavor, features, source, page
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description`,
        [
          c.id, c.name, c.hit_die, c.description, c.primary_ability, c.saving_throw_proficiencies,
          c.armor_proficiencies || [], c.weapon_proficiencies || [], c.tool_proficiencies || [],
          JSON.stringify(c.skill_choices), c.starting_equipment || [], 
          c.spellcasting ? JSON.stringify(c.spellcasting) : null,
          c.subclass_level, c.subclass_flavor, JSON.stringify(c.features || []), c.source, c.page || null
        ]
      );

      for (const sub of c.subclasses || []) {
        await client.query(
          `INSERT INTO subclasses (id, class_id, name, flavor_name, description, source, features) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description`,
          [sub.id, c.id, sub.name, sub.flavor_name || null, sub.description, sub.source, JSON.stringify(sub.features || [])]
        );
      }
    }
  });
}

async function seedRaces() {
  const path = join(DATA_DIR, 'races.json');
  if (!existsSync(path)) return console.log('No races data found to seed.');
  const races = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${races.length} races...`);
  
  await transaction(async (client) => {
    for (const r of races) {
      await client.query(
        `INSERT INTO races (
          id, name, size, speed, ability_score_increases, traits, subraces, languages, source, page
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET traits = EXCLUDED.traits`,
        [
          r.id, r.name, r.size, r.speed, JSON.stringify(r.ability_score_increases || {}),
          JSON.stringify(r.traits || []), JSON.stringify(r.subraces || []), r.languages || [],
          r.source, r.page || null
        ]
      );
    }
  });
}

async function seedBackgrounds() {
  const path = join(DATA_DIR, 'backgrounds.json');
  if (!existsSync(path)) return console.log('No backgrounds data found to seed.');
  const backgrounds = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${backgrounds.length} backgrounds...`);
  
  await transaction(async (client) => {
    for (const b of backgrounds) {
      await client.query(
        `INSERT INTO backgrounds (
          id, name, description, skill_proficiencies, tool_proficiencies, languages, 
          starting_equipment, starting_gold, feature_name, feature_description, 
          personality_traits, ideals, bonds, flaws, source, page
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description`,
        [
          b.id, b.name, b.description, b.skill_proficiencies, b.tool_proficiencies || [],
          b.languages || 0, b.starting_equipment || [], b.starting_gold || 0,
          b.feature_name, b.feature_description, b.personality_traits || [],
          b.ideals || [], b.bonds || [], b.flaws || [], b.source, b.page || null
        ]
      );
    }
  });
}

async function seedItems() {
  const path = join(DATA_DIR, 'items.json');
  if (!existsSync(path)) return console.log('No items data found to seed.');
  const items = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${items.length} items...`);
  
  await transaction(async (client) => {
    for (const i of items) {
      await client.query(
        `INSERT INTO items (
          id, name, category, rarity, requires_attunement, attunement_desc, 
          weight, cost, description, properties, damage, armor_class, range, 
          magic_bonus, source, page
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description`,
        [
          i.id, i.name, i.category, i.rarity || 'common', i.requires_attunement || false,
          i.attunement_desc || null, i.weight || null, i.cost ? JSON.stringify(i.cost) : null,
          i.description, i.properties || [], i.damage ? JSON.stringify(i.damage) : null,
          i.armor_class ? JSON.stringify(i.armor_class) : null, i.range ? JSON.stringify(i.range) : null,
          i.magic_bonus || null, i.source, i.page || null
        ]
      );
    }
  });
}

async function seedFeats() {
  const path = join(DATA_DIR, 'feats.json');
  if (!existsSync(path)) return console.log('No feats data found to seed.');
  const feats = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`Seeding ${feats.length} feats...`);
  
  await transaction(async (client) => {
    for (const f of feats) {
      await client.query(
        `INSERT INTO feats (
          id, name, prerequisite, description, source, page
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description`,
        [
          f.id, f.name, f.prerequisite || null, f.description, f.source, f.page || null
        ]
      );
    }
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


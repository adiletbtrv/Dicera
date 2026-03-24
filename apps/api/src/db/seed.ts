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

async function defaultSeed() {
  try {
    await seedSpells();
    await seedMonsters();
    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

defaultSeed();

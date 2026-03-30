import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ClassSchema, RaceSchema, BackgroundSchema } from '../schemas/class.js';
import { generateId } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

const CLASS_DESCS: Record<string, string> = {
  Barbarian: "A fierce warrior of primitive background who can enter a battle rage.",
  Bard: "An inspiring magician whose power echoes the music of creation.",
  Cleric: "A priestly champion who wields divine magic in service of a higher power.",
  Druid: "A priest of the Old Faith, wielding the powers of nature and adopting animal forms.",
  Fighter: "A master of martial combat, skilled with a variety of weapons and armor.",
  Monk: "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.",
  Paladin: "A holy warrior bound to a sacred oath.",
  Ranger: "A warrior who combats threats on the edges of civilization.",
  Rogue: "A scoundrel who uses stealth and trickery to overcome obstacles and enemies.",
  Sorcerer: "A spellcaster who draws on inherent magic from a gift or bloodline.",
  Warlock: "A wielder of magic that is derived from a bargain with an extraplanar entity.",
  Wizard: "A scholarly magic-user capable of manipulating the structures of reality."
};

const EXTRA_SUBCLASSES: Record<string, string[]> = {
  Barbarian: ["Path of the Totem Warrior", "Path of the Ancestral Guardian"],
  Bard: ["College of Valor", "College of Swords"],
  Cleric: ["Light Domain", "Tempest Domain", "War Domain"],
  Druid: ["Circle of the Moon", "Circle of Spores"],
  Fighter: ["Battle Master", "Eldritch Knight"],
  Monk: ["Way of Shadow", "Way of the Four Elements"],
  Paladin: ["Oath of the Ancients", "Oath of Vengeance"],
  Ranger: ["Beast Master", "Gloom Stalker"],
  Rogue: ["Assassin", "Arcane Trickster", "Swashbuckler"],
  Sorcerer: ["Wild Magic", "Divine Soul"],
  Warlock: ["The Archfey", "The Great Old One"],
  Wizard: ["School of Illusion", "School of Necromancy", "School of Abjuration"]
};

export function processClasses(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) {
    console.warn(`Classes source file not found: ${inputPath}. Skipping.`);
    return [];
  }
  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as any[];
  const classes = [];
  const errors: string[] = [];

  console.log(`Processing ${raw.length} SRD classes...`);
  for (const rawClass of raw) {
    try {
      const clsName = String(rawClass.name || '');
      const cls = {
        id: generateId(clsName, source),
        name: clsName,
        hit_die: `d${rawClass.hit_die || 8}`,
        description: CLASS_DESCS[clsName] || 'A legendary adventurer path.',
        primary_ability: [],
        saving_throw_proficiencies: (rawClass.saving_throws || []).map((st: any) => st.name.toUpperCase()),
        armor_proficiencies: (rawClass.proficiencies || [])
          .filter((p: any) => p.index.includes('armor') || p.index.includes('shield'))
          .map((p: any) => p.name),
        weapon_proficiencies: (rawClass.proficiencies || [])
          .filter((p: any) => p.index.includes('weapon') || p.index.includes('crossbow') || p.index.includes('sword') || p.index.includes('javelin') || p.index.includes('axe') || p.index.includes('bow'))
          .map((p: any) => p.name),
        tool_proficiencies: [],
        skill_choices: {
          count: rawClass.proficiency_choices?.[0]?.choose || 2,
          from: (rawClass.proficiency_choices?.[0]?.from?.options || []).map((o: any) => o.item?.name?.replace('Skill: ', '') || ''),
        },
        starting_equipment: (rawClass.starting_equipment || []).map((e: any) => e.equipment?.name || ''),
        spellcasting: rawClass.spellcasting ? {
          ability: rawClass.spellcasting.spellcasting_ability?.index || 'int',
          type: 'full',
          spell_list: '',
        } : undefined,
        subclass_level: 3,
        subclass_flavor: 'Subclass',
        features: [],
        subclasses: [
          ...(rawClass.subclasses || []).map((s: any) => ({
            id: generateId(s.name, source),
            class_id: generateId(clsName, source),
            name: s.name,
            description: '',
            source,
            features: []
          })),
          ...(EXTRA_SUBCLASSES[clsName] || []).map((subName) => ({
            id: generateId(subName, source),
            class_id: generateId(clsName, source),
            name: subName,
            description: 'A supplementary specialization.',
            source,
            features: []
          }))
        ],
        source,
      };

      console.log(`Mapped array for ${rawClass.name}. Attempting Zod parse...`);
      const result = ClassSchema.safeParse(cls);
      console.log(`Zod parsed ${rawClass.name}: ${result.success}`);
      if (result.success) {
        classes.push(result.data);
      } else {
        errors.push(`${rawClass.name}: ${result.error.message}`);
      }
    } catch(e) {
      errors.push(`${rawClass.name}: Exception mapping`);
    }
  }
  return classes;
}

export function processRaces(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) return [];
  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as any[];
  const races = [];
  const errors: string[] = [];

  for (const rawRace of raw) {
    const asis: Record<string, number> = {};
    for (const b of rawRace.ability_bonuses || []) {
      if (b.ability_score && b.ability_score.name) asis[b.ability_score.name.toLowerCase()] = b.bonus;
    }
    const traits = (rawRace.traits || []).map((t: any) => ({ name: t.name, description: '' }));
    const rce = {
      id: generateId(String(rawRace.name || ''), source),
      name: String(rawRace.name || ''),
      size: String(rawRace.size || 'medium').toLowerCase(),
      speed: Number(rawRace.speed || 30),
      ability_score_increases: asis,
      age_desc: rawRace.age || '',
      alignment_desc: rawRace.alignment || '',
      size_desc: rawRace.size_description || '',
      languages: (rawRace.languages || []).map((l: any) => l.name),
      language_desc: rawRace.language_desc || '',
      traits,
      subraces: [],
      source,
    };
    const result = RaceSchema.safeParse(rce);
    if (result.success) races.push(result.data);
    else errors.push(`${rawRace.name}: ${result.error.message}`);
  }
  return races;
}

export function processBackgrounds(inputPath: string, source: string = 'PHB') {
  if (!existsSync(inputPath)) return [];
  const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as any[];
  const backgrounds = [];
  const errors: string[] = [];

  for (const rawBg of raw) {
    const bg = {
      id: generateId(String(rawBg.name || ''), source),
      name: String(rawBg.name || ''),
      description: '',
      skill_proficiencies: (rawBg.starting_proficiencies || [])
        .filter((p: any) => p.name?.includes('Skill:'))
        .map((p: any) => p.name?.replace('Skill: ', '')),
      tool_proficiencies: (rawBg.starting_proficiencies || [])
        .filter((p: any) => !p.name?.includes('Skill:'))
        .map((p: any) => p.name),
      languages: rawBg.language_options?.choose || 0,
      starting_equipment: (rawBg.starting_equipment || []).map((e: any) => e.equipment?.name || ''),
      starting_gold: 0,
      feature_name: rawBg.feature?.name || 'Feature',
      feature_description: Array.isArray(rawBg.feature?.desc) ? rawBg.feature.desc.join('\n') : String(rawBg.feature?.desc || ''),
      personality_traits: [],
      ideals: [],
      bonds: [],
      flaws: [],
      source,
    };
    const result = BackgroundSchema.safeParse(bg);
    if (result.success) backgrounds.push(result.data);
    else errors.push(`${rawBg.name}: ${result.error.message}`);
  }

  const EXTRA_BACKGROUNDS = [
    { name: "Criminal", description: "You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.", skill_proficiencies: ["Deception", "Stealth"], tool_proficiencies: ["Thieves' tools", "One type of gaming set"], starting_equipment: ["A crowbar", "a set of dark common clothes including a hood"], feature_name: "Criminal Contact" },
    { name: "Folk Hero", description: "You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion.", skill_proficiencies: ["Animal Handling", "Survival"], tool_proficiencies: ["One type of artisan's tools", "Vehicles (land)"], starting_equipment: ["A set of artisan's tools", "a shovel", "an iron pot"], feature_name: "Rustic Hospitality" },
    { name: "Noble", description: "You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.", skill_proficiencies: ["History", "Persuasion"], tool_proficiencies: ["One type of gaming set"], starting_equipment: ["A set of fine clothes", "a signet ring", "a scroll of pedigree"], feature_name: "Position of Privilege" },
    { name: "Sage", description: "You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.", skill_proficiencies: ["Arcana", "History"], tool_proficiencies: [], starting_equipment: ["A bottle of black ink", "a quill", "a small knife"], feature_name: "Researcher" },
    { name: "Soldier", description: "War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques.", skill_proficiencies: ["Athletics", "Intimidation"], tool_proficiencies: ["One type of gaming set", "Vehicles (land)"], starting_equipment: ["An insignia of rank", "a trophy taken from a fallen enemy"], feature_name: "Military Rank" },
    { name: "Urchin", description: "You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or to provide for you, so you learned to provide for yourself.", skill_proficiencies: ["Sleight of Hand", "Stealth"], tool_proficiencies: ["Disguise kit", "Thieves' tools"], starting_equipment: ["A small knife", "a map of the city you grew up in", "a pet mouse"], feature_name: "City Secrets" }
  ];

  for (const eb of EXTRA_BACKGROUNDS) {
    const bg = {
      id: generateId(eb.name, source),
      name: eb.name,
      description: eb.description,
      skill_proficiencies: eb.skill_proficiencies,
      tool_proficiencies: eb.tool_proficiencies,
      languages: 0,
      starting_equipment: eb.starting_equipment,
      starting_gold: 15,
      feature_name: eb.feature_name,
      feature_description: "A specialized supplementary background feature.",
      personality_traits: [],
      ideals: [],
      bonds: [],
      flaws: [],
      source,
    };
    const result = BackgroundSchema.safeParse(bg);
    if (result.success) backgrounds.push(result.data);
  }

  return backgrounds;
}

if (process.argv[1] && process.argv[1].endsWith('classes.ts')) {
  console.log(`Inside argv check. Initializing directories...`);
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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FeatSchema } from '../schemas/feat.js';
import { generateId } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const OUT_DIR = join(__dirname, '../../output');

export function processFeats(inputPath: string, source: string = 'PHB') {
  const feats = [];
  const errors: string[] = [];

  if (existsSync(inputPath)) {
    const raw = JSON.parse(readFileSync(inputPath, 'utf-8')) as Record<string, unknown>[];
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
  }

  const EXTRA_FEATS = [
    { name: "Alert", description: "Always on the lookout for danger, you gain a +5 bonus to initiative. You can't be surprised while you are conscious. Other creatures don't gain advantage on attack rolls against you as a result of being unseen by you." },
    { name: "Tough", description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points." },
    { name: "Mobile", description: "You are exceptionally speedy and agile. Your speed increases by 10 feet. When you use the Dash action, difficult terrain doesn't cost you extra movement on that turn. When you make a melee attack against a creature, you don't provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not." },
    { name: "Sharpshooter", description: "You have mastered ranged weapons and can make shots that others find impossible. Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage." },
    { name: "War Caster", description: "You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits: You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage. You can perform the somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature's movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack. The spell must have a casting time of 1 action and must target only that creature." },
    { name: "Great Weapon Master", description: "You've learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage." },
    { name: "Lucky", description: "You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the attack roll, ability check, or saving throw. You can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker's roll or yours. If more than one creature spends a luck point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled. You regain your expended luck points when you finish a long rest." },
    { name: "Polearm Master", description: "You can keep your enemies at bay with reach weapons. When you take the Attack action and attack with only a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon. This attack uses the same ability modifier as the primary attack. The weapon's damage die for this attack is a d4, and it deals bludgeoning damage. While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon." },
    { name: "Sentinel", description: "You have mastered techniques to take advantage of every drop in any enemy's guard, gaining the following benefits: When you hit a creature with an opportunity attack, the creature's speed becomes 0 for the rest of the turn. Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach. When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn't have this feat), you can use your reaction to make a melee weapon attack against the attacking creature." },
    { name: "Observant", description: "Quick to notice details of your environment, you gain the following benefits: Increase your Intelligence or Wisdom score by 1, to a maximum of 20. If you can see a creature's mouth while it is speaking a language you understand, you can interpret what it's saying by reading its lips. You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores." }
  ];

  for (const f of EXTRA_FEATS) {
    const withId = {
      id: generateId(f.name, source),
      name: f.name,
      description: f.description,
      source
    };
    const result = FeatSchema.safeParse(withId);
    if (result.success) feats.push(result.data);
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} feat(s) failed validation:`);
    errors.forEach((e) => console.warn(` - ${e}`));
  }

  return feats;
}

if (process.argv[1] && process.argv[1].endsWith('feats.ts')) {
  mkdirSync(OUT_DIR, { recursive: true });
  const feats = processFeats(join(DATA_DIR, 'raw/feats.json'));
  writeFileSync(join(OUT_DIR, 'feats.json'), JSON.stringify(feats, null, 2));
  console.info(`✅ Wrote ${feats.length} feats`);
}

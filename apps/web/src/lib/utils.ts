import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function crToNumber(cr: string | number): number {
  if (typeof cr === 'number') return cr;
  if (cr.includes('/')) {
    const [n, d] = cr.split('/').map(Number);
    return (n ?? 1) / (d ?? 1);
  }
  return parseFloat(cr) || 0;
}

export function formatCR(cr: string | number): string {
  return String(cr);
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function parseExpression(expr: string): number {
  const clean = expr.trim().toLowerCase();
  const match = /^(\d+)d(\d+)([+-]\d+)?$/i.exec(clean);
  if (!match) return parseInt(clean) || 0;

  const count = parseInt(match[1] ?? '1');
  const sides = parseInt(match[2] ?? '6');
  const modifier = match[3] ? parseInt(match[3]) : 0;

  let total = modifier;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export const ABILITY_NAMES: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const SKILL_ABILITIES: Record<string, string> = {
  acrobatics: 'dex',
  'animal handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight of hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
};

export const SPELL_SCHOOLS = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
] as const;

export const MONSTER_TYPES = [
  'aberration', 'beast', 'celestial', 'construct', 'dragon',
  'elemental', 'fey', 'fiend', 'giant', 'humanoid',
  'monstrosity', 'ooze', 'plant', 'undead',
] as const;

export const MONSTER_SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'] as const;

export const DND_CLASSES = [
  'artificer', 'barbarian', 'bard', 'blood hunter', 'cleric', 'druid', 
  'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer',
  'warlock', 'wizard'
] as const;

export const DND_RACES = [
  'aarakocra', 'aasimar', 'bugbear', 'centaur', 'changeling', 'dragonborn', 
  'dwarf', 'elf', 'firbolg', 'genasi', 'githyanki', 'githzerai', 'gnome', 
  'goblin', 'goliath', 'half-elf', 'half-orc', 'halfling', 'harengon', 
  'hobgoblin', 'human', 'kenku', 'kobold', 'leonin', 'lizardfolk', 'loxodon', 
  'minotaur', 'orc', 'shifter', 'symic hybrid', 'tabaxi', 'tiefling', 'tortle', 
  'triton', 'vedalken', 'warforged', 'yuan-ti pureblood'
] as const;

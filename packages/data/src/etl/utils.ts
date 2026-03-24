import { createHash } from 'crypto';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateId(name: string, source: string): string {
  return createHash('sha1')
    .update(`${source}::${name}`)
    .digest('hex')
    .substring(0, 16);
}

export function normalizeCR(cr: string | number): string {
  const crStr = String(cr);
  const fractionMap: Record<string, string> = {
    '0.125': '1/8',
    '0.25': '1/4',
    '0.5': '1/2',
  };
  return fractionMap[crStr] ?? crStr;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function crToProficiencyBonus(cr: string | number): number {
  const crNum = typeof cr === 'string' ? parseCRToNumber(cr) : cr;
  if (crNum < 5) return 2;
  if (crNum < 9) return 3;
  if (crNum < 13) return 4;
  if (crNum < 17) return 5;
  if (crNum < 21) return 6;
  if (crNum < 25) return 7;
  if (crNum < 29) return 8;
  return 9;
}

export function parseCRToNumber(cr: string): number {
  if (cr.includes('/')) {
    const [num, den] = cr.split('/').map(Number);
    return (num ?? 1) / (den ?? 1);
  }
  return parseFloat(cr) || 0;
}

export function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function chunkText(text: string, maxChunkSize: number = 512): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

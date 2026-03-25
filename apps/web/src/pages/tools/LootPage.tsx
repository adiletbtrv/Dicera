import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';

const COINS_BY_CR: Record<string, [number, number, number, number, number]> = {
  '0-4':  [6, 0, 0, 0, 0],
  '5-10': [2, 3, 0, 0, 0],
  '11-16':[0, 1, 2, 0, 0],
  '17+':  [0, 0, 1, 1, 0],
};

const MUNDANE_ITEMS = ['Rope (50 ft)', 'Torch (10)', 'Rations (3 days)', 'Healer\'s Kit', 'Crowbar', 'Superior Healing Potion', 'Tinderbox', 'Map and compass', 'Iron spikes (10)', 'Grappling hook'];
const MAGIC_ITEMS: Record<string, string[]> = {
  uncommon: ['Bag of Holding', 'Boots of Elvenkind', 'Cloak of Protection', 'Eyes of the Eagle', 'Goggles of Night', 'Potion of Heroism', 'Rope of Climbing', 'Stone of Good Luck', 'Wand of Magic Missiles'],
  rare: ['Amulet of Health', 'Belt of Giant Strength (Hill)', 'Flame Tongue', 'Horn of Blasting', 'Necklace of Fireballs', 'Ring of Protection', 'Staff of Striking'],
  'very rare': ['Cloak of Invisibility', 'Crystal Ball', 'Hammer of Thunderbolts', 'Ring of Regeneration', 'Staff of Power'],
  legendary: ['Vorpal Sword', 'Talisman of Pure Good', 'Sphere of Annihilation', 'Staff of the Magi'],
};

function d(sides: number) { return Math.floor(Math.random() * sides) + 1; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

interface LootResult {
  cp: number; sp: number; gp: number; ep: number; pp: number;
  mundane: string[]; magic: { rarity: string; name: string }[];
}

export function LootPage() {
  const [cr, setCr] = useState('5-10');
  const [partySize, setPartySize] = useState(4);
  const [result, setResult] = useState<LootResult | null>(null);

  const { data: magicItemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get<{ data: { id: string, name: string, rarity: string }[] }>('/items?limit=500'),
  });

  function generate() {
    const [cpD, spD, gpD, epD, ppD] = COINS_BY_CR[cr] ?? [0, 0, 0, 0, 0];
    const mult = partySize;

    const loot: LootResult = {
      cp: cpD * d(6) * mult,
      sp: spD * d(6) * mult,
      gp: gpD * d(6) * mult,
      ep: epD * d(6) * mult,
      pp: ppD * d(6) * mult,
      mundane: d(4) > 2 ? [pick(MUNDANE_ITEMS), ...(d(6) > 4 ? [pick(MUNDANE_ITEMS)] : [])] : [],
      magic: [],
    };

    const dbItems = magicItemsData?.data ?? [];
    const source = (r: string) => {
      const filtered = dbItems.filter(i => i.rarity.toLowerCase() === r);
      return filtered.length > 0 ? filtered.map(i => i.name) : MAGIC_ITEMS[r]!;
    };

    const roll = d(100);
    if (roll >= 95) loot.magic.push({ rarity: 'legendary', name: pick(source('legendary')) });
    else if (roll >= 80) loot.magic.push({ rarity: 'very rare', name: pick(source('very rare')) });
    else if (roll >= 60) loot.magic.push({ rarity: 'rare', name: pick(source('rare')) });
    else if (roll >= 30) loot.magic.push({ rarity: 'uncommon', name: pick(source('uncommon')) });

    setResult(loot);
  }

  const COIN_LABELS = [['CP', 'var(--copper)'], ['SP', 'var(--silver)'], ['EP', 'var(--teal)'], ['GP', 'var(--gold)'], ['PP', 'var(--purple2)']];
  const RARITY_COLORS: Record<string, string> = { uncommon: 'var(--success)', rare: 'var(--accent)', 'very rare': 'var(--purple2)', legendary: 'var(--gold2)' };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-7 h-7" style={{ color: 'var(--gold)' }} />
        <h1 className="font-heading text-3xl font-bold">Loot Generator</h1>
      </div>
      <div className="card mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">CR Range</label>
            <select className="input" value={cr} onChange={(e) => setCr(e.target.value)}>
              {Object.keys(COINS_BY_CR).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Party Size</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setPartySize((p) => Math.max(1, p - 1))} className="btn-secondary px-3">-</button>
              <span className="flex-1 text-center font-bold font-heading text-lg">{partySize}</span>
              <button onClick={() => setPartySize((p) => Math.min(8, p + 1))} className="btn-secondary px-3">+</button>
            </div>
          </div>
        </div>
        <button onClick={generate} className="btn-primary w-full flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Generate Loot
        </button>
      </div>
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-4">Currency</h2>
            <div className="grid grid-cols-5 gap-3">
              {[result.cp, result.sp, result.ep, result.gp, result.pp].map((amt, i) => (
                <div key={i} className="text-center py-2 rounded-xl" style={{ background: 'var(--surface-raised)', border: `1px solid ${COIN_LABELS[i]![1]}` }}>
                  <p className="font-heading font-bold text-xl" style={{ color: COIN_LABELS[i]![1] }}>{amt}</p>
                  <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>{COIN_LABELS[i]![0]}</p>
                </div>
              ))}
            </div>
          </div>
          {result.mundane.length > 0 && (
            <div className="card">
              <h2 className="font-heading font-semibold mb-3">Mundane Items</h2>
              <ul className="space-y-1">{result.mundane.map((item, i) => <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {item}</li>)}</ul>
            </div>
          )}
          {result.magic.length > 0 && (
            <div className="card">
              <h2 className="font-heading font-semibold mb-3">Magic Items</h2>
              {result.magic.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-ui capitalize px-2 py-0.5 rounded-full" style={{ background: `${RARITY_COLORS[item.rarity]}18`, color: RARITY_COLORS[item.rarity], border: `1px solid ${RARITY_COLORS[item.rarity]}` }}>{item.rarity}</span>
                  <p className="font-ui font-semibold text-sm">{item.name}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

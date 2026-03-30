import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomSelect } from '@/components/ui/CustomSelect';

const XP_THRESHOLDS: Record<string, [number, number, number, number]> = {
  '1': [25, 50, 75, 100], '2': [50, 100, 150, 200], '3': [75, 150, 225, 400],
  '4': [125, 250, 375, 500], '5': [250, 500, 750, 1100], '6': [300, 600, 900, 1400],
  '7': [350, 750, 1100, 1700], '8': [450, 900, 1400, 2100], '9': [550, 1100, 1600, 2400],
  '10': [600, 1200, 1900, 2800], '11': [800, 1600, 2400, 3600], '12': [1000, 2000, 3000, 4500],
  '13': [1100, 2200, 3400, 5100], '14': [1250, 2500, 3800, 5700], '15': [1400, 2800, 4300, 6400],
  '16': [1600, 3200, 4800, 7200], '17': [2000, 3900, 5900, 8800], '18': [2100, 4200, 6300, 9500],
  '19': [2400, 4900, 7300, 10900], '20': [2800, 5700, 8500, 12700],
};

const CR_XP: Record<string, number> = { '0': 0, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000 };
const MULT_TABLE = [[1], [1, 1.5], [1.5, 2], [2, 2, 2.5], [2, 2.5, 2.5, 3], [2.5, 2.5, 3, 3, 4]];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Deadly'];
const DIFF_COLORS = ['var(--teal)', 'var(--gold)', 'var(--copper)', 'var(--dragon)'];

export function CrBudgetPage() {
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState('5');
  const [monsters, setMonsters] = useState<{ cr: string; qty: number }[]>([]);

  const thresholds = (XP_THRESHOLDS[partyLevel] ?? [0, 0, 0, 0]).map((t) => t * partySize);
  const totalXp = monsters.reduce((sum, m) => sum + (CR_XP[m.cr] ?? 0) * m.qty, 0);
  const monsterCount = monsters.reduce((sum, m) => sum + m.qty, 0);
  const multIdx = Math.min(5, monsterCount > 15 ? 5 : monsterCount > 10 ? 4 : monsterCount > 6 ? 3 : monsterCount > 2 ? 2 : monsterCount === 2 ? 1 : 0);
  const mult = MULT_TABLE[multIdx]?.[Math.min(MULT_TABLE[multIdx]!.length - 1, Math.floor((+partyLevel - 1) / 5))] ?? 1;
  const adjustedXp = Math.round(totalXp * mult);
  const diffIdx = thresholds.findIndex((t) => adjustedXp < t);
  const diff = diffIdx === -1 ? 3 : Math.max(diffIdx - 1, 0);
  const diffLabel = adjustedXp === 0 ? 'None' : DIFFICULTIES[diffIdx === -1 ? 3 : diffIdx] ?? 'None';
  const diffColor = DIFF_COLORS[diffIdx === -1 ? 3 : diffIdx] ?? 'var(--text-muted)';

  function addMonster(cr: string) { setMonsters((prev) => { const ex = prev.find((m) => m.cr === cr); return ex ? prev.map((m) => m.cr === cr ? { ...m, qty: m.qty + 1 } : m) : [...prev, { cr, qty: 1 }]; }); }
  function removeMonster(cr: string) { setMonsters((prev) => prev.map((m) => m.cr === cr ? { ...m, qty: m.qty - 1 } : m).filter((m) => m.qty > 0)); }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-7 h-7" style={{ color: 'var(--gold2)' }} />
        <h1 className="font-heading text-3xl font-bold">CR Budget Tool</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-3">Party</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Size</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPartySize((p) => Math.max(1, p - 1))} className="btn-secondary px-3">-</button>
                  <span className="flex-1 text-center font-bold font-heading text-lg">{partySize}</span>
                  <button onClick={() => setPartySize((p) => Math.min(8, p + 1))} className="btn-secondary px-3">+</button>
                </div>
              </div>
              <div>
                <label className="label">Level</label>
                <CustomSelect
                  value={partyLevel}
                  onChange={setPartyLevel}
                  options={Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: `Level ${i + 1}` }))}
                />
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-heading font-semibold mb-3">XP Thresholds</h2>
            <div className="space-y-1 text-sm">
              {DIFFICULTIES.map((d, i) => (
                <div key={d} className="flex justify-between">
                  <span style={{ color: DIFF_COLORS[i] }}>{d}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{thresholds[i]?.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-3">Add Monsters</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CR_XP).map((cr) => (
                <button key={cr} onClick={() => addMonster(cr)} className="btn-secondary px-2 py-1 text-xs">CR {cr}</button>
              ))}
            </div>
          </div>
          {monsters.length > 0 && (
            <div className="card">
              <h2 className="font-heading font-semibold mb-3">Monsters</h2>
              <div className="space-y-2">
                {monsters.map((m) => (
                  <div key={m.cr} className="flex items-center gap-3">
                    <span className="badge-cr flex-shrink-0">CR {m.cr}</span>
                    <span className="flex-1 text-sm">{m.qty}x · {((CR_XP[m.cr] ?? 0) * m.qty).toLocaleString()} XP</span>
                    <button onClick={() => removeMonster(m.cr)} className="btn-secondary px-2 py-1 text-xs">-</button>
                    <button onClick={() => addMonster(m.cr)} className="btn-secondary px-2 py-1 text-xs">+</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {adjustedXp > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-6">
              <p className="font-heading text-5xl font-bold mb-2" style={{ color: diffColor }}>{diffLabel}</p>
              <div className="flex justify-center gap-8 text-sm mt-4">
                <div><p style={{ color: 'var(--text-muted)' }}>Raw XP</p><p className="font-bold">{totalXp.toLocaleString()}</p></div>
                <div><p style={{ color: 'var(--text-muted)' }}>Multiplier</p><p className="font-bold">×{mult}</p></div>
                <div><p style={{ color: 'var(--text-muted)' }}>Adjusted XP</p><p className="font-bold">{adjustedXp.toLocaleString()}</p></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
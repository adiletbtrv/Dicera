import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomSelect } from '@/components/ui/CustomSelect';

import { XP_BY_CR as CR_XP, XP_THRESHOLDS_BY_LEVEL as XP_THRESHOLDS, MULT_TABLE } from '@dnd/data';
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Deadly'];
const DIFF_COLORS = ['var(--teal)', 'var(--gold)', 'var(--copper)', 'var(--dragon)'];

export function CrBudgetPage() {
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState('5');
  const [monsters, setMonsters] = useState<{ cr: string; qty: number }[]>([]);

  const pl = Number(partyLevel);
  const tObj = XP_THRESHOLDS[pl as keyof typeof XP_THRESHOLDS] ?? { easy: 0, medium: 0, hard: 0, deadly: 0 };
  const thresholds = [tObj.easy ?? 0, tObj.medium ?? 0, tObj.hard ?? 0, tObj.deadly ?? 0].map((t) => t * partySize);
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
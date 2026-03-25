import { useState } from 'react';
import { api } from '@/lib/api.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { useEncounterStore } from '@/store/encounter.js';
import { Swords, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EncounterMonster { monster_id: string; monster_name: string; quantity: number; xp_each: number; cr: string }
interface DifficultyResult { difficulty: string; totalXp: number; adjustedXp: number; xpPerPlayer: number }

export function EncounterBuilderPage() {
  const { 
    partySize, partyLevel, monsters, 
    setPartySize, setPartyLevel, addCustomMonster, removeMonster 
  } = useEncounterStore();
  
  const [result, setResult] = useState<DifficultyResult | null>(null);
  const [monsterInput, setMonsterInput] = useState({ name: '', cr: '1', qty: 1 });

  const XP_BY_CR: Record<string, number> = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900 };

  function addMonsterManual() {
    if (!monsterInput.name) return;
    addCustomMonster(monsterInput.name, monsterInput.cr, monsterInput.qty, XP_BY_CR[monsterInput.cr] ?? 200);
    setMonsterInput({ name: '', cr: '1', qty: 1 });
  }

  async function calculate() {
    const res = await api.post<DifficultyResult>('/encounters/calculate', { monsters, party_size: partySize, party_level: partyLevel, name: 'calc' });
    setResult(res);
  }

  const diffColors: Record<string, string> = { easy: '#4ade80', medium: '#facc15', hard: '#fb923c', deadly: '#f87171' };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Swords className="w-7 h-7" style={{ color: 'var(--dragon)' }} />
        <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Encounter Builder</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Party</h2>
            <div className="space-y-2">
              <div>
                <label className="label">Party Size</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPartySize(Math.max(1, partySize - 1))} className="btn-secondary px-3 py-1 text-lg font-bold">-</button>
                  <input type="number" min={1} max={8} value={partySize} onChange={(e) => setPartySize(+e.target.value)} className="input flex-1 text-center font-bold" />
                  <button type="button" onClick={() => setPartySize(Math.min(8, partySize + 1))} className="btn-secondary px-3 py-1 text-lg font-bold">+</button>
                </div>
              </div>
              <div>
                <label className="label">Party Level</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPartyLevel(Math.max(1, partyLevel - 1))} className="btn-secondary px-3 py-1 text-lg font-bold">-</button>
                  <input type="number" min={1} max={20} value={partyLevel} onChange={(e) => setPartyLevel(+e.target.value)} className="input flex-1 text-center font-bold" />
                  <button type="button" onClick={() => setPartyLevel(Math.min(20, partyLevel + 1))} className="btn-secondary px-3 py-1 text-lg font-bold">+</button>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Add Custom Monster</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Monster name..." value={monsterInput.name} onChange={(e) => setMonsterInput((p) => ({ ...p, name: e.target.value }))} className="input w-full" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={monsterInput.cr}
                    onChange={(val) => setMonsterInput((p) => ({ ...p, cr: val }))}
                    options={['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(cr => ({ value: cr, label: `CR ${cr}` }))}
                  />
                </div>
                <input type="number" min={1} max={50} value={monsterInput.qty} onChange={(e) => setMonsterInput((p) => ({ ...p, qty: +e.target.value }))} className="input w-20 text-center" placeholder="Qty" />
              </div>
              <button disabled={!monsterInput.name} onClick={addMonsterManual} className="btn-secondary w-full flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Monster</button>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Monsters ({monsters.length})</h2>
            {monsters.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No monsters added yet.</p> : (
              <div className="space-y-2">
                {monsters.map((m, i) => (
                  <div key={m.monster_id} className="flex items-center justify-between py-1.5 text-sm" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{m.quantity}x {m.monster_name}</span>
                    <span className="font-ui" style={{ color: 'var(--text-muted)' }}>CR {m.cr} · {(m.xp_each * m.quantity).toLocaleString()} XP</span>
                    <button onClick={() => removeMonster(m.instance_id)} className="btn-ghost p-1 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            {monsters.length > 0 && <button onClick={calculate} className="btn-primary mt-4 w-full">Calculate Difficulty</button>}
          </div>
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card"
              >
                <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Results</h2>
                <div className="text-center py-4">
                  <p className="font-heading text-4xl font-bold capitalize" style={{ color: diffColors[result.difficulty] ?? 'var(--text-primary)' }}>{result.difficulty}</p>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div><p style={{ color: 'var(--text-muted)' }}>Total XP</p><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.totalXp.toLocaleString()}</p></div>
                    <div><p style={{ color: 'var(--text-muted)' }}>Adjusted XP</p><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.adjustedXp.toLocaleString()}</p></div>
                    <div><p style={{ color: 'var(--text-muted)' }}>Per Player</p><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.xpPerPlayer.toLocaleString()}</p></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

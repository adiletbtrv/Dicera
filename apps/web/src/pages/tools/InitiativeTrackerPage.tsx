import { useState } from 'react';
import { useInitiativeStore } from '@/store/initiative.js';
import { Swords, Plus, Play, Square, SkipForward, Trash2, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONDITION_LIST = ['Blinded', 'Charmed', 'Frightened', 'Grappled', 'Incapacitated', 'Paralyzed', 'Poisoned', 'Prone', 'Restrained', 'Stunned'];

export function InitiativeTrackerPage() {
  const { combatants, currentIndex, round, isActive, addCombatant, removeCombatant, updateCombatant, sortByInitiative, nextTurn, start, end, clear } = useInitiativeStore();
  const [form, setForm] = useState({ name: '', initiative: 0, hp: 10, maxHp: 10, type: 'monster' as 'player' | 'monster' | 'npc' });
  const alive = combatants.filter((c) => !c.isDown);
  const current = alive[currentIndex];

  function add() {
    if (!form.name.trim()) return;
    addCombatant({ name: form.name, initiative: form.initiative, hp: form.hp, maxHp: form.maxHp, type: form.type });
    setForm({ name: '', initiative: 0, hp: 10, maxHp: 10, type: 'monster' });
  }

  function handleDamage(id: string, delta: number) {
    const c = combatants.find((x) => x.id === id);
    if (!c) return;
    const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
    updateCombatant(id, { hp: newHp, isDown: newHp === 0 });
  }

  const TYPE_COLORS = { player: 'var(--teal)', monster: 'var(--dragon)', npc: 'var(--gold2)' };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Swords className="w-7 h-7" style={{ color: 'var(--dragon)' }} />
        <h1 className="font-heading text-3xl font-bold">Initiative Tracker</h1>
        {isActive && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-ui" style={{ color: 'var(--text-muted)' }}>Round {round}</span>
            {current && <span className="badge-cr">{current.name}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-heading font-semibold mb-3">Add Combatant</h2>
            <div className="space-y-2">
              <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Initiative</label>
                  <input type="number" className="input" value={form.initiative} onChange={(e) => setForm((p) => ({ ...p, initiative: +e.target.value }))} />
                </div>
                <div>
                  <label className="label text-xs">Max HP</label>
                  <input type="number" className="input" min={1} value={form.maxHp} onChange={(e) => setForm((p) => ({ ...p, maxHp: +e.target.value, hp: +e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-1">
                {(['player', 'monster', 'npc'] as const).map((t) => (
                  <button key={t} onClick={() => setForm((p) => ({ ...p, type: t }))} className={`btn text-xs flex-1 ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}>{t}</button>
                ))}
              </div>
              <button onClick={add} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {!isActive ? (
              <button onClick={() => { sortByInitiative(); start(); }} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={combatants.length === 0}>
                <Play className="w-4 h-4" /> Start
              </button>
            ) : (
              <>
                <button onClick={nextTurn} className="btn-primary flex-1 flex items-center justify-center gap-2"><SkipForward className="w-4 h-4" /> Next Turn</button>
                <button onClick={end} className="btn-secondary px-3"><Square className="w-4 h-4" /></button>
              </>
            )}
            <button onClick={clear} className="btn-secondary px-3" title="Clear all"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="md:col-span-2">
          {combatants.length === 0 ? (
            <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>Add combatants to begin</div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {[...combatants].sort((a, b) => b.initiative - a.initiative).map((c, i) => {
                  const isCurrent = isActive && alive[currentIndex]?.id === c.id;
                  const color = TYPE_COLORS[c.type];
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card flex items-center gap-3"
                      style={{
                        border: isCurrent ? `1px solid ${color}` : undefined,
                        opacity: c.isDown ? 0.45 : 1,
                        background: isCurrent ? `${color}0d` : undefined,
                      }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-bold text-sm flex-shrink-0" style={{ background: `${color}20`, color }}>
                        {c.initiative}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-ui font-semibold text-sm truncate">{c.name}</p>
                          {c.isDown && <span className="text-xs" style={{ color: 'var(--dragon)' }}>Down</span>}
                          {c.concentration && <span className="text-xs" style={{ color: 'var(--accent)' }}>Conc.</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {c.conditions.map((cond) => (
                            <span key={cond} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>{cond}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleDamage(c.id, -5)} className="btn-secondary px-2 py-1 text-xs">-5</button>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-ui font-bold" style={{ background: 'var(--surface-raised)' }}>
                          <Heart className="w-3.5 h-3.5" style={{ color: 'var(--dragon)' }} />
                          <span style={{ color: c.hp < c.maxHp * 0.25 ? 'var(--dragon)' : 'var(--text-primary)' }}>{c.hp}</span>
                          <span style={{ color: 'var(--text-muted)' }}>/{c.maxHp}</span>
                        </div>
                        <button onClick={() => handleDamage(c.id, 5)} className="btn-secondary px-2 py-1 text-xs">+5</button>
                      </div>
                      <button onClick={() => removeCombatant(c.id)} className="btn-ghost p-1.5 rounded-lg flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

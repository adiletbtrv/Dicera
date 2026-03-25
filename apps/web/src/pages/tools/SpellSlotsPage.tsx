import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SPELL_SLOTS: Record<number, number[]> = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

const LEVEL_NAMES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

export function SpellSlotsPage() {
  const [level, setLevel] = useState(5);
  const [used, setUsed] = useState<number[]>(Array(9).fill(0));
  const slots = SPELL_SLOTS[level] ?? Array(9).fill(0);

  function resetUsed() { setUsed(Array(9).fill(0)); }
  function useSlot(lvlIdx: number) {
    setUsed((u) => u.map((v, i) => i === lvlIdx ? Math.min(v + 1, slots[i]!) : v));
  }
  function restoreSlot(lvlIdx: number) {
    setUsed((u) => u.map((v, i) => i === lvlIdx ? Math.max(v - 1, 0) : v));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold">Spell Slots Calculator</h1>
      </div>
      <div className="card mb-6">
        <label className="label">Spellcaster Level</label>
        <div className="flex items-center gap-3">
          <input type="range" min={1} max={20} value={level} onChange={(e) => { setLevel(+e.target.value); resetUsed(); }} className="flex-1 accent-[var(--accent)]" />
          <span className="font-heading font-bold text-xl w-8 text-center" style={{ color: 'var(--accent)' }}>{level}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {LEVEL_NAMES.map((name, i) => {
          const total = slots[i] ?? 0;
          const remainingSlots = total - used[i]!;
          if (total === 0) return null;
          return (
            <motion.div key={i} layout className="card text-center py-4">
              <p className="text-xs font-ui uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{name}</p>
              <div className="flex justify-center gap-1 mb-3 flex-wrap">
                {Array.from({ length: total }).map((_, j) => (
                  <div key={j} className="w-4 h-4 rounded-full transition-all" style={{ background: j < remainingSlots ? 'var(--accent)' : 'var(--surface-raised)', border: '1px solid var(--border)' }} />
                ))}
              </div>
              <p className="font-heading font-bold text-lg" style={{ color: remainingSlots === 0 ? 'var(--dragon)' : 'var(--text-primary)' }}>{remainingSlots}/{total}</p>
              <div className="flex gap-1 mt-2 justify-center">
                <button onClick={() => useSlot(i)} className="btn-secondary px-2 py-1 text-xs" disabled={remainingSlots === 0}>Use</button>
                <button onClick={() => restoreSlot(i)} className="btn-secondary px-2 py-1 text-xs" disabled={used[i] === 0}>+1</button>
              </div>
            </motion.div>
          );
        })}
      </div>
      <button onClick={resetUsed} className="btn-secondary w-full">Long Rest (Restore All)</button>
    </div>
  );
}

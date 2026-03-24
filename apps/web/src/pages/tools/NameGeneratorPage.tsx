import { useState } from 'react';
import { RefreshCw, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAMES: Record<string, { prefixes: string[]; suffixes: string[] }> = {
  Human: { prefixes: ['Al', 'Bar', 'Cal', 'Dal', 'Ed', 'Fer', 'Gar', 'Hal', 'Iv', 'Jan', 'Kor', 'Lor', 'Mar', 'Nor', 'Ol', 'Per', 'Ran', 'Sar', 'Tav', 'Ul', 'Val', 'Wil', 'Xan', 'Yor', 'Zar'], suffixes: ['an', 'en', 'er', 'ard', 'ish', 'or', 'us', 'ian', 'ius', 'en', 'ic', 'ek', 'ok', 'iel', 'ael'] },
  Elf: { prefixes: ['Ael', 'Aer', 'Ara', 'Cal', 'Cel', 'El', 'Eri', 'Gal', 'Ilm', 'Kira', 'Lae', 'Miri', 'Nael', 'Que', 'Ria', 'Syl', 'Tali', 'Umi', 'Vala', 'Xil', 'Zyl'], suffixes: ['iel', 'ael', 'inor', 'ial', 'wen', 'ith', 'ara', 'dir', 'rin', 'is', 'ael', 'ion', 'ias', 'eira', 'indel'] },
  Dwarf: { prefixes: ['Bal', 'Bok', 'Bor', 'Dal', 'Dum', 'Dur', 'Eld', 'Fun', 'Gar', 'Gim', 'Glo', 'Hal', 'Kar', 'Kor', 'Mab', 'Orb', 'Thor', 'Thur', 'Ulf'], suffixes: ['in', 'en', 'ek', 'ak', 'ul', 'or', 'orn', 'dur', 'grin', 'ri', 'an', 'im', 'ok', 'un', 'il'] },
  Halfling: { prefixes: ['Bil', 'Dal', 'Elm', 'Fin', 'Fred', 'Ger', 'Hal', 'Mel', 'Mul', 'Nos', 'Pip', 'Per', 'Ros', 'Sam', 'Tom', 'Wil'], suffixes: ['bo', 'do', 'go', 'oc', 'by', 'ric', 'den', 'ger', 'ley', 'lin', 'wise', 'foot', 'bur'] },
  Tiefling: { prefixes: ['Art', 'Ash', 'Bal', 'Bel', 'Car', 'Dae', 'Eze', 'Gar', 'Kae', 'Kal', 'Le', 'Lor', 'Mal', 'Ner', 'Phe', 'Ral', 'Sar', 'Sel', 'Tor', 'Ves', 'Zal'], suffixes: ['ius', 'ax', 'ar', 'us', 'is', 'ix', 'al', 'iel', 'amon', 'ver', 'ath', 'eth', 'on', 'ael'] },
  Dragonborn: { prefixes: ['Arj', 'Balar', 'Caar', 'Daar', 'Gar', 'Kel', 'Kor', 'Meh', 'Nad', 'Pata', 'Rash', 'Sar', 'Shar', 'Tal', 'Torinn', 'Var', 'Vrax', 'Wrath'], suffixes: ['an', 'ash', 'at', 'ax', 'ix', 'on', 'or', 'tal', 'zan', 'ar', 'ik'] },
};

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]!; }
function generate(race: string): string {
  const r = NAMES[race];
  if (!r) return 'Unknown';
  return pick(r.prefixes) + pick(r.suffixes);
}

export function NameGeneratorPage() {
  const [race, setRace] = useState('Human');
  const [count, setCount] = useState(5);
  const [names, setNames] = useState<string[]>([]);

  function roll() {
    setNames(Array.from({ length: count }, () => generate(race)));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-7 h-7" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold">Name Generator</h1>
      </div>
      <div className="card mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Race</label>
            <select className="input" value={race} onChange={(e) => setRace(e.target.value)}>
              {Object.keys(NAMES).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Count</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="btn-secondary px-3">-</button>
              <span className="flex-1 text-center font-bold font-heading text-lg">{count}</span>
              <button onClick={() => setCount((c) => Math.min(20, c + 1))} className="btn-secondary px-3">+</button>
            </div>
          </div>
        </div>
        <button onClick={roll} className="btn-primary w-full flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Generate Names
        </button>
      </div>
      <AnimatePresence mode="wait">
        {names.length > 0 && (
          <motion.div key={names.join()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {names.map((name, i) => (
                <div key={i} className="px-4 py-3 rounded-xl text-center font-heading font-semibold" style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}>
                  {name}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

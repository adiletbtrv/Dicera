import { DiceRoller } from '@/components/ui/DiceRoller.js';
import { useDiceStore } from '@/store/dice.js';
import { Dice5 } from 'lucide-react';

export function DiceRollerPage() {
  const { clearHistory, history } = useDiceStore();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Dice5 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dice Roller</h1>
            <p className="mt-1 font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>Roll any dice expression</p>
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="btn-ghost text-sm">Clear History</button>
        )}
      </div>
      <div className="card">
        <DiceRoller />
      </div>
    </div>
  );
}

import { create } from 'zustand';

export interface DiceRoll {
  id: string;
  expression: string;
  total: number;
  rolls: Array<{ die: number; value: number }>;
  modifier: number;
  breakdown: string;
  label?: string;
  timestamp: number;
}

interface DiceState {
  history: DiceRoll[];
  addRoll: (roll: Omit<DiceRoll, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  history: [],

  addRoll: (roll) =>
    set((state) => ({
      history: [
        {
          ...roll,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
        ...state.history.slice(0, 49),
      ],
    })),

  clearHistory: () => set({ history: [] }),
}));

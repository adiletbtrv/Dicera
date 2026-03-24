import { create } from 'zustand';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  type: 'player' | 'monster' | 'npc';
  conditions: string[];
  concentration: boolean;
  isDown: boolean;
}

interface InitiativeStore {
  combatants: Combatant[];
  currentIndex: number;
  round: number;
  isActive: boolean;
  addCombatant: (c: Omit<Combatant, 'id' | 'conditions' | 'concentration' | 'isDown'>) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  sortByInitiative: () => void;
  nextTurn: () => void;
  start: () => void;
  end: () => void;
  clear: () => void;
}

export const useInitiativeStore = create<InitiativeStore>((set, get) => ({
  combatants: [],
  currentIndex: 0,
  round: 1,
  isActive: false,
  addCombatant: (c) => set((s) => ({
    combatants: [...s.combatants, { ...c, id: Math.random().toString(36).slice(2), conditions: [], concentration: false, isDown: false }],
  })),
  removeCombatant: (id) => set((s) => ({ combatants: s.combatants.filter((c) => c.id !== id) })),
  updateCombatant: (id, updates) => set((s) => ({
    combatants: s.combatants.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  sortByInitiative: () => set((s) => ({
    combatants: [...s.combatants].sort((a, b) => b.initiative - a.initiative),
    currentIndex: 0,
  })),
  nextTurn: () => set((s) => {
    const alive = s.combatants.filter((c) => !c.isDown);
    const nextIndex = (s.currentIndex + 1) % alive.length;
    const newRound = nextIndex === 0 ? s.round + 1 : s.round;
    return { currentIndex: nextIndex, round: newRound };
  }),
  start: () => set({ isActive: true, round: 1, currentIndex: 0 }),
  end: () => set({ isActive: false, round: 1, currentIndex: 0 }),
  clear: () => set({ combatants: [], currentIndex: 0, round: 1, isActive: false }),
}));

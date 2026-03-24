import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Monster } from '@dnd/data';

export interface EncounterMonster {
  instance_id: string;
  monster_id?: string | undefined;
  monster_name: string;
  quantity: number;
  xp_each: number;
  cr: string;
}

interface EncounterState {
  monsters: EncounterMonster[];
  partySize: number;
  partyLevel: number;
  setPartySize: (size: number) => void;
  setPartyLevel: (level: number) => void;
  addMonster: (monster: Partial<Monster>, quantity?: number) => void;
  addCustomMonster: (name: string, cr: string, quantity: number, xp_each: number) => void;
  removeMonster: (instanceId: string) => void;
  updateQuantity: (instanceId: string, quantity: number) => void;
  clearEncounter: () => void;
}

export const useEncounterStore = create<EncounterState>()(
  persist(
    (set) => ({
      monsters: [],
      partySize: 4,
      partyLevel: 5,
      setPartySize: (size) => set({ partySize: size }),
      setPartyLevel: (level) => set({ partyLevel: level }),
      addMonster: (monster, quantity = 1) =>
        set((state) => {
          const existing = state.monsters.find((m) => m.monster_id === monster.id);
          if (existing && monster.id) {
            return {
              monsters: state.monsters.map((m) =>
                m.monster_id === monster.id ? { ...m, quantity: m.quantity + quantity } : m
              ),
            };
          }
          return {
            monsters: [
              ...state.monsters,
              {
                instance_id: crypto.randomUUID(),
                monster_id: monster.id || undefined,
                monster_name: monster.name ?? 'Unknown',
                quantity,
                xp_each: monster.xp ?? 0,
                cr: String(monster.challenge_rating ?? '0'),
              },
            ],
          };
        }),
      addCustomMonster: (name, cr, quantity, xp_each) =>
        set((state) => ({
          monsters: [
            ...state.monsters,
            {
              instance_id: crypto.randomUUID(),
              monster_id: undefined,
              monster_name: name,
              quantity,
              xp_each,
              cr,
            },
          ],
        })),
      removeMonster: (instanceId) =>
        set((state) => ({
          monsters: state.monsters.filter((m) => m.instance_id !== instanceId),
        })),
      updateQuantity: (instanceId, quantity) =>
        set((state) => ({
          monsters: state.monsters.map((m) =>
            m.instance_id === instanceId ? { ...m, quantity: Math.max(1, quantity) } : m
          ),
        })),
      clearEncounter: () => set({ monsters: [] }),
    }),
    {
      name: 'dicera-encounter-storage',
    }
  )
);

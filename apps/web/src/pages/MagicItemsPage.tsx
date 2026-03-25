import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState';

interface Item { id: string; name: string; rarity: string; category: string; requires_attunement: boolean; source: string; description: string }

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--text-muted)',
  uncommon: 'var(--success)',
  rare: 'var(--accent)',
  'very rare': 'var(--purple2)',
  legendary: 'var(--gold2)',
  artifact: 'var(--dragon)',
};

export function MagicItemsPage() {
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['magic-items', q, rarity],
    queryFn: () => api.get<{ data: Item[] }>('/items', { q: q || undefined, rarity: rarity || undefined, limit: 80 }),
  });

  const RARITIES = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];
  const items = (data?.data ?? []).filter((i) => RARITIES.includes(i.rarity));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-7 h-7" style={{ color: 'var(--purple2)' }} />
        <h1 className="font-heading text-3xl font-bold">Magic Items</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-10" placeholder="Search magic items..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...RARITIES].map((r) => {
            const color = RARITY_COLORS[r] ?? 'var(--text-muted)';
            return (
              <button key={r} onClick={() => setRarity(r)} className={r === rarity ? 'btn-primary text-xs py-1.5 capitalize' : 'btn-secondary text-xs py-1.5 capitalize'}>
                {r === '' ? 'All Rarities' : r}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Sparkles} title="No magic items found" description="Try a different search or rarity" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const color = RARITY_COLORS[item.rarity] ?? 'var(--text-muted)';
            const cleanDesc = item.description.replace(/^(Armor|Weapon|Wondrous Item|Ring|Wand|Staff|Rod|Potion|Scroll)[^\n]*\n+/i, '').trim();

            return (
              <div key={item.id} className="card flex flex-col hover:border-[var(--border-strong)] transition-colors" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</h2>
                  <div className="flex gap-1 flex-wrap flex-shrink-0">
                    <span className="text-[10px] font-ui uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm" style={{ background: `${color}15`, color }}>{item.rarity}</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4 mt-2 whitespace-pre-wrap flex-1" style={{ color: 'var(--text-secondary)' }}>{cleanDesc}</p>

                <div className="flex items-center gap-2 text-xs font-ui mt-auto pt-4 border-t border-[var(--border-subtle)]" style={{ color: 'var(--text-muted)' }}>
                  <span className="capitalize">{item.category}</span>
                  {item.requires_attunement && <span className="text-[var(--dragon)]">(Requires Attunement)</span>}
                  <span className="ml-auto opacity-50">{item.source}</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Sparkles, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

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
              <button key={r} onClick={() => setRarity(r)} className={r === rarity ? 'btn-primary text-xs py-1.5' : 'btn-secondary text-xs py-1.5'}>
                {r === '' ? 'All Rarities' : r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            );
          })}
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Sparkles} title="No magic items found" description="Try a different search or rarity" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const color = RARITY_COLORS[item.rarity] ?? 'var(--text-muted)';
            return (
              <div key={item.id} className="card" style={{ borderLeft: `2px solid ${color}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</h2>
                  <div className="flex gap-1 flex-wrap flex-shrink-0">
                    <span className="text-xs font-ui capitalize" style={{ color }}>{item.rarity}</span>
                    {item.requires_attunement && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(attunement)</span>}
                  </div>
                </div>
                <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{item.category} · {item.source}</p>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

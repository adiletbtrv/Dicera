import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Package, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

interface Item { id: string; name: string; category: string; cost?: { quantity: number; unit: string }; weight?: number; source: string; properties?: string[] }

export function EquipmentPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', q, category],
    queryFn: () => api.get<{ data: Item[] }>('/items', {
      q: q || undefined,
      category: category || undefined,
      limit: 100,
    }),
  });

  const items = (data?.data ?? []).filter((i) => !['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].includes(i.category));
  const CATEGORIES = ['weapon', 'armor', 'adventuring gear', 'tool', 'mount', 'trade good'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-7 h-7" style={{ color: 'var(--silver)' }} />
        <h1 className="font-heading text-3xl font-bold">Equipment</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-10" placeholder="Search equipment..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cat === category ? 'btn-primary text-xs py-1.5 capitalize' : 'btn-secondary text-xs py-1.5 capitalize'}
            >
              {cat === '' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="No equipment found" description="Try a different search or category" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card hover:border-[var(--silver)] transition-colors flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-heading font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.name}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-ui font-medium">
                <span className="badge-level capitalize text-[var(--text-primary)] bg-[var(--surface-raised)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
                {item.cost && <span style={{ color: 'var(--gold)' }}>{item.cost.quantity} {item.cost.unit.toUpperCase()}</span>}
                {item.weight != null && <span style={{ color: 'var(--text-muted)' }}>{item.weight} lbs</span>}
              </div>

              {item.properties && item.properties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {item.properties.map((p) => (
                    <span key={p} className="text-[10px] font-ui uppercase tracking-wider px-1.5 py-0.5 rounded-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
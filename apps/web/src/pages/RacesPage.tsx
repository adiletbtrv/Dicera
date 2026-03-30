import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

interface Race { id: string; name: string; size: string; speed: number; source: string; ability_score_increases: Record<string, number> }

export function RacesPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['races', q],
    queryFn: () => api.get<{ data: Race[] }>('/races', { q: q || undefined }),
  });

  const races = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-7 h-7" style={{ color: 'var(--teal)' }} />
        <h1 className="font-heading text-3xl font-bold">Races</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-10"
          placeholder="Search races..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" style={{ background: 'var(--surface-raised)' }} />
          ))}
        </div>
      ) : races.length === 0 ? (
        <EmptyState icon={Users} title="No races found" description="Try a different search term" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {races.map((race) => {
            const asis = Object.entries(race.ability_score_increases ?? {})
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k.toUpperCase()} +${v}`)
              .join(', ');
            return (
              <Link key={race.id} to={`/races/${race.id}`} className="card hover:border-[var(--teal)] group">
                <h2 className="font-heading font-bold text-lg mb-2 group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text-primary)' }}>{race.name}</h2>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {race.size}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {race.speed} ft.
                  </span>
                </div>
                {asis && <p className="text-xs font-ui" style={{ color: 'var(--teal2)' }}>{asis}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{race.source}</p>
              </Link>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

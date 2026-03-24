import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { GraduationCap, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

interface DndClass { id: string; name: string; hit_die: string; primary_ability: string[]; source: string }

const HIT_DIE_COLORS: Record<string, string> = {
  d6: 'var(--teal)', d8: 'var(--accent)', d10: 'var(--gold)', d12: 'var(--dragon)',
};

export function ClassesPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['classes', q],
    queryFn: () => api.get<DndClass[]>('/classes', { q: q || undefined }),
  });

  const classes = data ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-7 h-7" style={{ color: 'var(--gold)' }} />
        <h1 className="font-heading text-3xl font-bold">Classes</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-10" placeholder="Search classes..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" style={{ background: 'var(--surface-raised)' }} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No classes found" description="Try a different search term" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const color = HIT_DIE_COLORS[cls.hit_die] ?? 'var(--accent)';
            return (
              <Link key={cls.id} to={`/classes/${cls.id}`} className="card group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm" style={{ background: `${color}20`, border: `1px solid ${color}`, color }}>
                    {cls.hit_die}
                  </div>
                  <h2 className="font-heading font-bold text-lg group-hover:text-[var(--gold)] transition-colors">{cls.name}</h2>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cls.primary_ability?.map((a) => (
                    <span key={a} className="text-xs font-ui px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{a}</span>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{cls.source}</p>
              </Link>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

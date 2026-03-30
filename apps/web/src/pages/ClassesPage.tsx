import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { GraduationCap, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

interface DndClass { id: string; name: string; hit_die: string; description?: string; primary_ability: string[]; source: string }

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
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const color = HIT_DIE_COLORS[cls.hit_die] ?? 'var(--accent)';
            return (
              <motion.div key={cls.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}>
                <Link to={`/classes/${cls.id}`} className="card group flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]" style={{ backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-black text-lg bg-gradient-to-br shadow-inner" style={{ background: `linear-gradient(135deg, ${color}40, ${color}10)`, border: `1px solid ${color}50`, color }}>
                        {cls.hit_die}
                      </div>
                      <h2 className="font-heading font-bold text-xl group-hover:text-[var(--gold)] transition-colors">{cls.name}</h2>
                    </div>
                  </div>
                  <p className="text-sm mb-4 flex-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {cls.description || 'A legendary adventurer path.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {cls.primary_ability?.map((a) => (
                      <span key={a} className="text-[10px] font-ui font-semibold uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{a}</span>
                    ))}
                    <span className="text-[10px] uppercase font-ui ml-auto mt-1" style={{ color: 'var(--text-muted)' }}>{cls.source}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

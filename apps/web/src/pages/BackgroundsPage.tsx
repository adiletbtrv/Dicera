import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { BookOpen, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';

interface Background { id: string; name: string; skill_proficiencies: string[]; feature_name: string; source: string; description: string }

export function BackgroundsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['backgrounds', q],
    queryFn: () => api.get<{ data: Background[] }>('/backgrounds', { q: q || undefined }),
  });

  const items = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-7 h-7" style={{ color: 'var(--copper)' }} />
        <h1 className="font-heading text-3xl font-bold">Backgrounds</h1>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-10" placeholder="Search backgrounds..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" style={{ background: 'var(--surface-raised)' }} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No backgrounds found" description="Try a different search term" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((bg) => (
            <div key={bg.id} className="card">
              <h2 className="font-heading font-bold text-lg mb-1">{bg.name}</h2>
              <p className="text-xs mb-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{bg.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {bg.skill_proficiencies?.map((s) => (
                  <span key={s} className="text-xs font-ui px-2 py-0.5 rounded-full" style={{ background: 'rgba(184,115,51,0.12)', color: 'var(--copper)', border: '1px solid var(--copper)' }}>{s}</span>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Feature: {bg.feature_name}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

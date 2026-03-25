import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Star, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState.js';
import { Link } from 'react-router-dom';

interface Feat { id: string; name: string; prerequisite?: string; description: string; source: string }

export function FeatsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['feats', q],
    queryFn: () => api.get<{ data: Feat[] }>('/feats', { q: q || undefined }),
  });

  const feats = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-7 h-7" style={{ color: 'var(--gold2)' }} />
        <h1 className="font-heading text-3xl font-bold">Feats</h1>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-10" placeholder="Search feats..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : feats.length === 0 ? (
        <EmptyState icon={Star} title="No feats found" description="Try a different search term" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feats.map((feat) => (
            <Link key={feat.id} to={`/feats/${feat.id}`} className="card hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{feat.name}</h2>
                {feat.prerequisite && (
                  <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded-full font-ui" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--gold2)', border: '1px solid var(--gold2)' }}>
                    {feat.prerequisite}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{feat.description}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{feat.source}</p>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Condition { id: string; name: string; category: string; rules: string[] }

const CATEGORY_COLORS: Record<string, string> = {
  perception: 'var(--teal)',
  mental: 'var(--accent)',
  movement: 'var(--gold2)',
  debilitating: 'var(--dragon)',
};

export function ConditionsPage() {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['conditions', q],
    queryFn: () => api.get<Condition[]>('/conditions', { q: q || undefined }),
  });

  const conditions = data ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7" style={{ color: 'var(--dragon)' }} />
        <h1 className="font-heading text-3xl font-bold">Conditions</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-10" placeholder="Search conditions..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-12 animate-pulse hover:translate-y-0 hover:shadow-none" />)}</div>
      ) : (
        <div className="space-y-2">
          {conditions.map((cond) => {
            const color = CATEGORY_COLORS[cond.category] ?? 'var(--text-muted)';
            const isOpen = expanded === cond.id;
            return (
              <div key={cond.id} className="card overflow-hidden hover:translate-y-0 hover:shadow-none transition-none cursor-default">
                <button
                  className="w-full flex items-center gap-3 text-left cursor-pointer focus:outline-none"
                  onClick={() => setExpanded(isOpen ? null : cond.id)}
                  aria-expanded={isOpen}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <h2 className="font-heading font-semibold flex-1">{cond.name}</h2>
                  <span className="text-xs font-ui px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{ background: `${color}18`, color, border: `1px solid ${color}` }}>
                    {cond.category}
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-4 space-y-2 pl-5">
                        {cond.rules.map((rule, i) => (
                          <li key={i} className="text-sm leading-relaxed list-disc" style={{ color: 'var(--text-secondary)' }}>{rule}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
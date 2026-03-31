import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Wand2, Shield, Package, User } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  type: 'spell' | 'monster' | 'item' | 'race';
  subtitle?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  spell: <Wand2 className="w-3.5 h-3.5" />,
  monster: <Shield className="w-3.5 h-3.5" />,
  item: <Package className="w-3.5 h-3.5" />,
  race: <User className="w-3.5 h-3.5" />,
};

const TYPE_ROUTES: Record<string, string> = {
  spell: '/spells',
  monster: '/bestiary',
  item: '/magic-items',
  race: '/races',
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const enabled = isOpen && debouncedQuery.trim().length >= 2;

  const { data: spells } = useQuery({
    queryKey: ['cmd-spells', debouncedQuery],
    queryFn: () => api.get<{ data: { id: string; name: string; school: string }[] }>('/spells', { q: debouncedQuery, limit: 4 }),
    enabled,
    staleTime: 30_000,
  });

  const { data: monsters } = useQuery({
    queryKey: ['cmd-monsters', debouncedQuery],
    queryFn: () => api.get<{ data: { id: string; name: string; type: string; challenge_rating: string }[] }>('/monsters', { q: debouncedQuery, limit: 4 }),
    enabled,
    staleTime: 30_000,
  });

  const { data: items } = useQuery({
    queryKey: ['cmd-items', debouncedQuery],
    queryFn: () => api.get<{ data: { id: string; name: string; rarity: string }[] }>('/items', { q: debouncedQuery, limit: 3 }),
    enabled,
    staleTime: 30_000,
  });

  const { data: races } = useQuery({
    queryKey: ['cmd-races', debouncedQuery],
    queryFn: () => api.get<{ data: { id: string; name: string; size: string }[] }>('/races', { q: debouncedQuery, limit: 3 }),
    enabled,
    staleTime: 30_000,
  });

  const results: SearchResult[] = [
    ...(spells?.data ?? []).map((s) => ({ id: s.id, name: s.name, type: 'spell' as const, subtitle: s.school })),
    ...(monsters?.data ?? []).map((m) => ({ id: m.id, name: m.name, type: 'monster' as const, subtitle: `CR ${m.challenge_rating}` })),
    ...(items?.data ?? []).map((i) => ({ id: i.id, name: i.name, type: 'item' as const, subtitle: i.rarity })),
    ...(races?.data ?? []).map((r) => ({ id: r.id, name: r.name, type: 'race' as const, subtitle: r.size })),
  ];

  const navigate_to = useCallback((result: SearchResult) => {
    navigate(`${TYPE_ROUTES[result.type]}/${result.id}`);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIndex]) { navigate_to(results[selectedIndex]!); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, results, selectedIndex, navigate_to, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cmd-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', transform: 'translateZ(0)', willChange: 'opacity, backdrop-filter' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search spells, monsters, items, races..."
                className="flex-1 bg-transparent text-base outline-none font-body"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Global search"
              />
              <kbd className="text-xs font-ui px-2 py-0.5 rounded" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>ESC</kbd>
            </div>

            {query.trim().length >= 2 && (
              <div className="max-h-80 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="p-2">
                    {results.map((r, i) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => navigate_to(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                        style={{
                          background: i === selectedIndex ? 'var(--accent-muted)' : 'transparent',
                          color: 'var(--text-primary)',
                        }}
                        onMouseEnter={() => setSelectedIndex(i)}
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                          style={{ background: 'var(--surface-raised)', color: 'var(--accent)' }}>
                          {TYPE_ICONS[r.type]}
                        </span>
                        <span className="flex-1 text-sm font-ui font-medium">{r.name}</span>
                        {r.subtitle && <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{r.subtitle}</span>}
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>{r.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {query.trim().length === 0 && (
              <div className="py-6 px-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Type at least 2 characters to search
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

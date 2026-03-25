import { useState, useCallback, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { SpellCard } from '@/components/ui/SpellCard.js';
import { ListSkeleton } from '@/components/SkeletonLoader.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { SPELL_SCHOOLS, DND_CLASSES } from '@/lib/utils.js';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Spell } from '@dnd/data';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const item = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

interface SpellsResponse { data: Spell[]; total: number; page: number; limit: number }

interface Filters { q: string; level: string; school: string; class: string; concentration: string; ritual: string; page: number }

const INITIAL_FILTERS: Filters = { q: '', level: '', school: '', class: '', concentration: '', ritual: '', page: 1 };

export function SpellsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['spells', filters],
    queryFn: () => api.get<SpellsResponse>('/spells', {
      q: filters.q || undefined, level: filters.level || undefined,
      school: filters.school || undefined, class: filters.class || undefined,
      concentration: filters.concentration || undefined, ritual: filters.ritual || undefined,
      page: filters.page, limit: 30,
    }),
    placeholderData: (prev) => prev,
  });

  const updateFilter = useCallback(
    (key: keyof Filters, value: string | number) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
    }, [],
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Spell Compendium</h1>
            <p className="mt-1 font-ui text-sm" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} spells found</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input type="search" placeholder="Search spells..." value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)} className="input" />
          </div>
          <CustomSelect
            value={filters.level}
            onChange={(val) => updateFilter('level', val)}
            placeholder="All Levels"
            options={[
              { value: '', label: 'All Levels' },
              { value: '0', label: 'Cantrip' },
              ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => ({ value: l.toString(), label: `${l}st–${l}th` }))
            ]}
          />
          <CustomSelect
            value={filters.school}
            onChange={(val) => updateFilter('school', val)}
            placeholder="All Schools"
            options={[
              { value: '', label: 'All Schools' },
              ...SPELL_SCHOOLS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
            ]}
          />
          <CustomSelect
            value={filters.class}
            onChange={(val) => updateFilter('class', val)}
            placeholder="All Classes"
            className="md:col-span-2"
            options={[
              { value: '', label: 'All Classes' },
              ...DND_CLASSES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
            ]}
          />
          <div className="flex items-center gap-6 md:col-span-2 px-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer font-ui select-none whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={filters.concentration === 'true'}
                onChange={(e) => updateFilter('concentration', e.target.checked ? 'true' : '')}
                className="checkbox" /> Concentration
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer font-ui select-none whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={filters.ritual === 'true'}
                onChange={(e) => updateFilter('ritual', e.target.checked ? 'true' : '')}
                className="checkbox" /> Ritual
            </label>
          </div>
        </div>
      </div>

      {isLoading && <div className="py-8"><ListSkeleton count={12} /></div>}
      {isError && <div className="card text-center py-8" style={{ color: 'var(--dragon)', borderColor: 'var(--dragon)' }}>Failed to load spells. Make sure the API is running.</div>}

      {data && (
        <>
          <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {data.data.map((spell) => (
              <motion.div variants={item} key={spell.id} className="h-full">
                <SpellCard spell={spell} onClick={() => navigate(`/spells/${spell.id}`)} />
              </motion.div>
            ))}
          </motion.div>

          {data.data.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No spells match your filters.</div>}

          {data.total > 30 && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => updateFilter('page', filters.page - 1)} disabled={filters.page === 1} className="btn-secondary flex items-center gap-2 px-6 py-2.5 shadow-sm min-w-[140px]">
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              <span className="flex items-center text-sm px-6 font-ui bg-[var(--surface)] border border-[var(--border)] rounded-full py-1.5 shadow-sm" style={{ color: 'var(--text-secondary)' }}>
                Page <strong className="mx-1 text-[var(--accent)]">{filters.page}</strong> of {Math.ceil(data.total / 30)}
              </span>
              <button onClick={() => updateFilter('page', filters.page + 1)} disabled={filters.page >= Math.ceil(data.total / 30)} className="btn-secondary flex items-center justify-end gap-2 px-6 py-2.5 shadow-sm min-w-[140px]">
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { MONSTER_TYPES, MONSTER_SIZES, cn } from '@/lib/utils.js';
import { ListSkeleton } from '@/components/SkeletonLoader.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { Skull, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Monster } from '@dnd/data';

interface MonstersResponse { data: Partial<Monster>[]; total: number; page: number; limit: number }

const CR_OPTIONS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];

interface Filters { q: string; type: string; size: string; cr: string; page: number }

export function BestiaryPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ q: '', type: '', size: '', cr: '', page: 1 });
  const [searchInput, setSearchInput] = useState(filters.q);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monsters', filters],
    queryFn: () => api.get<MonstersResponse>('/monsters', {
      q: filters.q || undefined, type: filters.type || undefined,
      size: filters.size || undefined, cr: filters.cr || undefined,
      page: filters.page, limit: 40,
    }),
    placeholderData: (prev) => prev,
  });

  const update = useCallback(
    (key: keyof Filters, value: string | number) => {
      setFilters((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 };
      });
    }, [],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      update('q', searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, update]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Skull className="w-7 h-7" style={{ color: 'var(--dragon)' }} />
          <div>
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Bestiary</h1>
            <p className="mt-1 font-ui text-sm" style={{ color: 'var(--text-muted)' }}>{data?.total ?? 0} monsters found</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input type="search" placeholder="Search monsters..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} className="input" />
          </div>
          <CustomSelect
            value={filters.type}
            onChange={(val) => update('type', val)}
            placeholder="All Types"
            options={[
              { value: '', label: 'All Types' },
              ...MONSTER_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))
            ]}
          />
          <CustomSelect
            value={filters.size}
            onChange={(val) => update('size', val)}
            placeholder="All Sizes"
            options={[
              { value: '', label: 'All Sizes' },
              ...MONSTER_SIZES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
            ]}
          />
          <CustomSelect
            value={filters.cr}
            onChange={(val) => update('cr', val)}
            placeholder="All CR"
            options={[
              { value: '', label: 'All CR' },
              ...CR_OPTIONS.map((cr) => ({ value: cr, label: `CR ${cr}` }))
            ]}
          />
        </div>
      </div>

      {isLoading && <div className="py-8"><ListSkeleton count={12} /></div>}
      {isError && <div className="card text-center py-8" style={{ color: 'var(--dragon)' }}>Failed to load monsters. Make sure the API is running.</div>}

      {data && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-x-auto rounded-2xl"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="w-full text-sm font-body">
              <thead style={{ background: 'var(--surface-raised)' }}>
                <tr className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Alignment</th>
                  <th className="text-center px-4 py-3">AC</th>
                  <th className="text-center px-4 py-3">HP</th>
                  <th className="text-center px-4 py-3">CR</th>
                  <th className="text-right px-4 py-3">XP</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((monster) => (
                  <tr
                    key={String(monster['id'] ?? '')}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onClick={() => navigate(`/bestiary/${String(monster['id'] ?? '')}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{String(monster['name'] ?? '')}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{String(monster['size'] ?? '')}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{String(monster['type'] ?? '')}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{String(monster['alignment'] ?? '')}</td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-primary)' }}>{String(monster['armor_class'] ?? '')}</td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-primary)' }}>{String(monster['hit_points'] ?? '')}</td>
                    <td className="px-4 py-3 text-center"><span className={cn('badge-cr')}>{String(monster['challenge_rating'] ?? '')}</span></td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{(Number(monster['xp'] ?? 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {data.data.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No monsters match your filters.</div>}

          {data.total > 40 && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => update('page', filters.page - 1)} disabled={filters.page === 1} className="btn-secondary flex items-center gap-2 px-6 py-2.5 shadow-sm min-w-[140px]">
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              <span className="flex items-center text-sm px-6 font-ui bg-[var(--surface)] border border-[var(--border)] rounded-full py-1.5 shadow-sm" style={{ color: 'var(--text-secondary)' }}>
                Page <strong className="mx-1 text-[var(--accent)]">{filters.page}</strong> of {Math.ceil(data.total / 40)}
              </span>
              <button onClick={() => update('page', filters.page + 1)} disabled={filters.page >= Math.ceil(data.total / 40)} className="btn-secondary flex items-center justify-end gap-2 px-6 py-2.5 shadow-sm min-w-[140px]">
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

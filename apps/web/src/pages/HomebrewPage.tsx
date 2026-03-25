import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Link } from 'react-router-dom';
import { Wand2, Globe, PenTool, Heart, Eye, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastStore } from '@/store/toast';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface HomebrewItem { id: string; type: string; name: string; description: string; tags: string[]; likes: number; views: number; is_public: boolean; liked_by?: string[] }

export function HomebrewPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const toast = useToastStore(s => s.add);
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['homebrew', tab],
    queryFn: () => api.get<{ data: HomebrewItem[] }>('/homebrew', { is_public: tab === 'browse' ? 'true' : undefined, mine: tab === 'mine' ? 'true' : undefined }),
  });

  const toggleLikeMut = useMutation({
    mutationFn: (id: string) => api.post(`/homebrew/${id}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homebrew', tab] });
    },
    onError: () => toast({ type: 'error', message: 'You must be signed in to like homebrew.', duration: 3000 })
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Wand2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Homebrew Workshop</h1>
        </div>
        {user && <Link to="/homebrew/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Homebrew</Link>}
      </div>

      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'browse' as const, label: 'Browse', icon: <Globe className="w-4 h-4" /> },
          { id: 'mine' as const, label: 'My Homebrew', icon: <PenTool className="w-4 h-4" /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="btn-ghost flex items-center gap-2 text-sm"
            style={{
              background: tab === t.id ? 'var(--accent-muted)' : undefined,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {!user && tab === 'mine' && (
        <div className="text-center py-8">
          <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Sign in to manage your homebrew.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      )}
      {isLoading && <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading...</div>}
      {isError && <div className="card text-center py-8 hover:translate-y-0 hover:shadow-none" style={{ color: 'var(--dragon)' }}>Could not load homebrew content. Make sure the API server is running and the database is migrated.</div>}

      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data.map((hb) => {
          const isLiked = user && hb.liked_by?.includes(user.id);
          return (
            <motion.div variants={item} key={hb.id}>
              <div className="card h-full relative group hover:border-[var(--accent)] transition-colors flex flex-col">
                <Link to={`/homebrew/${hb.id}`} className="absolute inset-0 z-0" />

                <div className="flex items-start justify-between relative z-10 pointer-events-none">
                  <h2 className="font-heading font-semibold group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>{hb.name}</h2>
                  <span className="badge capitalize" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{hb.type}</span>
                </div>
                <p className="text-sm mt-2 mb-4 line-clamp-2 font-body relative z-10 pointer-events-none" style={{ color: 'var(--text-secondary)' }}>{hb.description || 'No description'}</p>

                <div className="mt-auto flex gap-4 text-xs relative z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); toggleLikeMut.mutate(hb.id); }}
                    className="flex items-center gap-1.5 hover:text-[var(--dragon)] hover:scale-110 transition-all cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-[var(--dragon)] text-[var(--dragon)]' : 'text-[var(--dragon)]'}`} /> {hb.likes}
                  </button>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" style={{ color: 'var(--accent)' }} /> {hb.views}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {data?.data.length === 0 && (
          <motion.div variants={item} className="col-span-3 text-center py-12 card hover:translate-y-0 hover:shadow-none">
            <p style={{ color: 'var(--text-secondary)' }}>No homebrew content found.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { useAuthStore } from '@/store/auth.js';
import { Map as MapIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapSummary { id: string; name: string; image_url: string; width_px: number; height_px: number; created_at: string }

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export function MapsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({ queryKey: ['maps'], queryFn: () => api.get<MapSummary[]>('/maps') });

  if (!user) return (
    <div className="text-center py-12">
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Sign in to manage maps.</p>
      <Link to="/login" className="btn-primary">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <MapIcon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Maps</h1>
        <div className="ml-auto">
          <Link to="/maps/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Upload Map</Link>
        </div>
      </div>
      {isLoading && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading maps...</div>}
      {isError && <div className="card text-center py-8" style={{ color: 'var(--dragon)' }}>Could not load maps. Make sure the API server is running and the database is migrated.</div>}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((m) => (
          <motion.div variants={item} key={m.id}>
            <div className="card cursor-pointer h-full" onClick={() => navigate(`/maps/${m.id}`)}>
              <div
                className="aspect-video rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
              >
                <MapIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h2 className="font-heading font-medium text-lg" style={{ color: 'var(--text-primary)' }}>{m.name}</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.width_px} × {m.height_px}px</p>
            </div>
          </motion.div>
        ))}
        {data?.length === 0 && (
          <motion.div variants={item} className="col-span-3 text-center py-16 card">
            <MapIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No maps yet. Upload your first map!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

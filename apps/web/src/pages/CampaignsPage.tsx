import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { useAuthStore } from '@/store/auth.js';
import { Scroll, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Campaign { id: string; name: string; description: string; system: string; status: string; created_at: string }

export function CampaignsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.get<Campaign[]>('/campaigns'), enabled: !!user });

  if (!user) return (
    <div className="text-center py-12">
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Sign in to manage campaigns.</p>
      <Link to="/login" className="btn-primary">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Scroll className="w-7 h-7" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Campaigns</h1>
        <div className="ml-auto">
          <Link to="/campaigns/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Campaign</Link>
        </div>
      </div>
      {isLoading && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>}
      {isError && <div className="card text-center py-8" style={{ color: 'var(--dragon)' }}>Could not load campaigns. Make sure the API server is running and the database is migrated.</div>}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.map((c) => (
          <motion.div variants={item} key={c.id}>
            <div className="card cursor-pointer h-full flex flex-col" onClick={() => navigate(`/campaigns/${c.id}`)}>
              <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{c.name}</h2>
              <p className="text-sm mt-2 flex-grow" style={{ color: 'var(--text-secondary)' }}>{c.description || 'No description'}</p>
              <div className="mt-4 flex gap-2">
                <span className="badge" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{c.system}</span>
                <span className="badge" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{c.status}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {data?.length === 0 && (
          <motion.div variants={item} className="col-span-2 text-center py-16 card">
            <Scroll className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No campaigns yet. Create your first!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

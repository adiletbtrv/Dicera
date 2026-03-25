import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, Heart, Eye, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';

interface HomebrewDetail {
  id: string;
  name: string;
  type: string;
  description: string;
  content: any;
  tags: string[];
  likes: number;
  views: number;
  creator_id: string;
}

export function HomebrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore(s => s.add);
  const user = useAuthStore(s => s.user);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['homebrew', id],
    queryFn: () => api.get<HomebrewDetail>(`/homebrew/${id}`),
    enabled: !!id,
  });

  const delMut = useMutation({
    mutationFn: () => api.delete(`/homebrew/${id}`),
    onSuccess: () => {
      toast({ type: 'success', message: 'Homebrew deleted successfully.', duration: 3000 });
      navigate('/homebrew');
    }
  });

  const isOwner = user && data?.creator_id === user.id;

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading homebrew...</div>;
  if (isError || !data) return <div className="text-center py-12" style={{ color: 'var(--dragon)' }}>Homebrew not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between overflow-hidden">
        <button onClick={() => navigate('/homebrew')} className="btn-ghost flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Workshop
        </button>

        {isOwner && (
          <div className="flex justify-end">
            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.div key="buttons" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex gap-2">
                  <button onClick={() => navigate(`/homebrew/${id}/edit`)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost flex items-center gap-1.5 text-sm py-1.5 text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
                  <span className="text-xs text-red-400 font-medium px-2">Are you sure?</span>
                  <button onClick={() => delMut.mutate()} disabled={delMut.isPending} className="btn-primary flex items-center gap-1.5 text-xs py-1 px-3 bg-red-500 hover:bg-red-600 text-white border-none">
                    {delMut.isPending ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-xs py-1 px-2 text-red-300 hover:text-red-200 hover:bg-red-500/20">
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative z-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.name}</h1>
          <span className="badge capitalize text-lg px-4 py-1" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{data.type}</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-ui mb-6" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" style={{ color: 'var(--dragon)' }} /> {data.likes} Likes</span>
          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" style={{ color: 'var(--accent)' }} /> {data.views} Views</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {data.tags?.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{tag}</span>
          ))}
        </div>

        {data.description && (
          <div className="mb-8">
            <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{data.description}</p>
          </div>
        )}

        <div className="p-6 rounded-xl border bg-[var(--surface-raised)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Properties</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(data.content || {}).map(([key, value]) => (
              <div key={key}>
                <span className="block font-semibold capitalize mb-1" style={{ color: 'var(--text-muted)' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || 'None'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Feat {
  id: string;
  name: string;
  prerequisite?: string;
  description: string;
  source: string;
}

export function FeatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: feat, isLoading, isError } = useQuery({
    queryKey: ['feat', id],
    queryFn: () => api.get<Feat>(`/feats/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (isError || !feat) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--red2)' }}>Feat not found.</p>
        <button onClick={() => navigate('/feats')} className="btn-secondary mt-4 flex items-center gap-1 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Back to Feats
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <button onClick={() => navigate('/feats')} className="btn-ghost flex items-center gap-1 mb-8">
        <ChevronLeft className="w-4 h-4" /> Back to Feats
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-strong)' }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6" style={{ color: 'var(--gold2)' }} />
              <h1 className="font-heading text-3xl font-bold tracking-tight" style={{ color: 'var(--gold2)' }}>{feat.name}</h1>
            </div>
            {feat.prerequisite && (
              <p className="font-ui text-sm flex items-center gap-2 mt-2" style={{ color: 'var(--text-muted)' }}>
                <span className="font-bold text-[var(--text-secondary)]">Prerequisite:</span> {feat.prerequisite}
              </p>
            )}
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          {feat.description.split('\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 leading-relaxed font-body" style={{ color: 'var(--text-secondary)' }}>
              {paragraph.startsWith('- ') ? (
                <span className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold2)' }} />
                  <span>{paragraph.substring(2)}</span>
                </span>
              ) : paragraph}
            </p>
          ))}
        </div>

        <p className="text-xs font-ui mt-8 pt-6 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-strong)' }}>
          Source: {feat.source}
        </p>
      </motion.div>
    </div>
  );
}

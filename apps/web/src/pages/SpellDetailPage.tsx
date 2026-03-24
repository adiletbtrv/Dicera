import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { SpellCard } from '@/components/ui/SpellCard.js';
import { ChevronLeft } from 'lucide-react';
import type { Spell } from '@dnd/data';

export function SpellDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: spell, isLoading, isError } = useQuery({
    queryKey: ['spell', id],
    queryFn: () => api.get<Spell>(`/spells/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (isError || !spell) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--dragon)' }}>Spell not found.</p>
        <button onClick={() => navigate('/spells')} className="btn-secondary mt-4 flex items-center gap-1 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Back to Spells
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/spells')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back to Spells
      </button>
      <SpellCard spell={spell} />
      {spell.higher_levels && (
        <div className="card mt-4">
          <h3 className="font-heading font-semibold mb-2" style={{ color: 'var(--accent)' }}>At Higher Levels</h3>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{spell.higher_levels}</p>
        </div>
      )}
    </div>
  );
}

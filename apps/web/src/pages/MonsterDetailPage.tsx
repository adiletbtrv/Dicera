import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { StatBlock } from '@/components/ui/StatBlock.js';
import { ChevronLeft, Swords } from 'lucide-react';
import { useEncounterStore } from '@/store/encounter.js';
import type { Monster } from '@dnd/data';
import { useToastStore } from '@/store/toast.js';

export function MonsterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addMonster = useEncounterStore((s) => s.addMonster);
  const toast = useToastStore((s) => s.add);

  const { data: monster, isLoading, isError } = useQuery({
    queryKey: ['monster', id],
    queryFn: () => api.get<Monster>(`/monsters/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (isError || !monster) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--dragon)' }}>Monster not found.</p>
        <button onClick={() => navigate('/bestiary')} className="btn-secondary mt-4 flex items-center gap-1 mx-auto">
          <ChevronLeft className="w-4 h-4" /> Back to Bestiary
        </button>
      </div>
    );
  }

  function handleAdd() {
    addMonster(monster!, 1);
    toast({ type: 'success', message: `${monster!.name} added to encounter!`, duration: 3000 });
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 relative">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <button onClick={() => navigate('/bestiary')} className="btn-ghost flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Bestiary
        </button>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-1.5 shadow-md">
          <Swords className="w-4 h-4" /> Add to Encounter
        </button>
      </div>
      <StatBlock monster={monster} />
      {monster.description && (
        <div className="card mt-4">
          <h3 className="font-heading font-semibold mb-2" style={{ color: 'var(--accent)' }}>Description</h3>
          <p className="text-sm whitespace-pre-wrap font-body" style={{ color: 'var(--text-secondary)' }}>{monster.description}</p>
        </div>
      )}
      <p className="text-xs mt-4 font-ui" style={{ color: 'var(--text-muted)' }}>Source: {monster.source}{monster.page ? ` p.${monster.page}` : ''}</p>
    </div>
  );
}

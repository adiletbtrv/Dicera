import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Map as MapIcon, ChevronLeft } from 'lucide-react';

export function MapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['map', id], queryFn: () => api.get<Record<string, unknown>>(`/maps/${id}`), enabled: !!id });

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!data) return <div className="text-center py-12" style={{ color: 'var(--dragon)' }}>Map not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate('/maps')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Maps
      </button>
      <h1 className="font-heading text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{String(data['name'] ?? '')}</h1>
      <div className="card text-center py-16">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
            <MapIcon className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Interactive map viewer — token placement, fog of war, annotations</p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Map: {String(data['image_url'] ?? '')}</p>
      </div>
    </div>
  );
}

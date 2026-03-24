import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft } from 'lucide-react';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['campaign', id], queryFn: () => api.get<Record<string, unknown>>(`/campaigns/${id}`), enabled: !!id });

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!data) return <div className="text-center py-12" style={{ color: 'var(--dragon)' }}>Campaign not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/campaigns')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Campaigns
      </button>
      <h1 className="font-heading text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{String(data['name'] ?? '')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['NPCs', 'Locations', 'Sessions'].map((section) => (
          <div key={section} className="card">
            <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{section}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {section.toLowerCase()} yet.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

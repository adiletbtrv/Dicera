import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { Scroll, ChevronLeft, Save } from 'lucide-react';

export function CampaignBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', description: '', dm_notes: '', system: 'D&D 5e', status: 'Planning' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      api.get<{ name: string; description?: string; dm_notes?: string }>(`/campaigns/${id}`)
         .then((res) => setFormData({ name: res.name, description: res.description || '', dm_notes: res.dm_notes || '', system: 'D&D 5e', status: 'Planning' }))
         .catch(console.error);
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (id) {
        await api.patch(`/campaigns/${id}`, {
          name: formData.name,
          description: formData.description,
          dm_notes: formData.dm_notes
        });
        navigate(`/campaigns/${id}`);
      } else {
        await api.post('/campaigns', {
          name: formData.name,
          description: formData.description,
          dm_notes: formData.dm_notes,
          system: formData.system,
          status: formData.status === 'Planning' ? 'active' : formData.status.toLowerCase()
        });
        navigate('/campaigns');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save campaign.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(id ? `/campaigns/${id}` : '/campaigns')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3 mb-6">
         <Scroll className="w-8 h-8" style={{ color: 'var(--accent)' }} />
         <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{id ? 'Edit Campaign' : 'New Campaign'}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Campaign Name</label>
          <input required type="text" className="input" placeholder="e.g. Curse of Strahd" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input resize-none" placeholder="A brief hook..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
        </div>
        <div>
          <label className="label">DM Notes (Private)</label>
          <textarea rows={4} className="input resize-none" placeholder="Secret plans, plot hooks, etc..." value={formData.dm_notes} onChange={e => setFormData({...formData, dm_notes: e.target.value})}></textarea>
        </div>
        <div className="pt-4 flex justify-end">
           <button type="submit" disabled={isSubmitting || !formData.name.trim()} className="btn-primary flex items-center gap-2">
             <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : (id ? 'Save Changes' : 'Create Campaign')}
           </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Scroll, ChevronLeft, Save } from 'lucide-react';
import { useToastStore } from '@/store/toast';

export function CampaignBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore((s) => s.add);

  const [formData, setFormData] = useState({ name: '', description: '', setting: '', dm_notes: '', system: 'D&D 5e', status: 'Planning' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      api.get<{ name: string; description?: string; setting?: string; dm_notes?: string; system?: string; status?: string; }>(`/campaigns/${id}`)
        .then((res) => setFormData({
          name: res.name,
          description: res.description || '',
          setting: res.setting || '',
          dm_notes: res.dm_notes || '',
          system: res.system || 'D&D 5e',
          status: res.status === 'active' ? 'Planning' : (res.status || 'Planning')
        }))
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
          setting: formData.setting,
          dm_notes: formData.dm_notes,
          system: formData.system
        });
        toast({ type: 'success', message: 'Campaign updated successfully!', duration: 3000 });
        navigate(`/campaigns/${id}`);
      } else {
        const res = await api.post<{ id: string }>('/campaigns', {
          name: formData.name,
          description: formData.description,
          setting: formData.setting,
          dm_notes: formData.dm_notes,
          system: formData.system,
          status: formData.status === 'Planning' ? 'active' : formData.status.toLowerCase()
        });
        toast({ type: 'success', message: 'Campaign created successfully!', duration: 3000 });
        navigate(`/campaigns/${res.id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        type: 'error',
        message: err?.message?.includes('dm_notes') ? 'Database Error: Missing dm_notes column.' : 'Failed to save campaign.',
        duration: 5000
      });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Campaign Name</label>
            <input required type="text" className="input" placeholder="e.g. Curse of Strahd" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Setting</label>
            <input type="text" className="input" placeholder="e.g. Forgotten Realms, Theros..." value={formData.setting} onChange={e => setFormData({ ...formData, setting: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input resize-none" placeholder="A brief hook..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
        </div>
        <div>
          <label className="label">DM Notes (Private)</label>
          <textarea rows={4} className="input resize-none" placeholder="Secret plans, plot hooks, etc..." value={formData.dm_notes} onChange={e => setFormData({ ...formData, dm_notes: e.target.value })}></textarea>
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
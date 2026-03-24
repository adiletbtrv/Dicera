import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { Scroll, ChevronLeft, Save } from 'lucide-react';

export function CampaignBuilderPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', description: '', system: 'D&D 5e', status: 'Planning' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/campaigns', {
        name: formData.name,
        description: formData.description,
        system: formData.system,
        status: formData.status === 'Planning' ? 'active' : formData.status.toLowerCase()
      });
      navigate('/campaigns');
    } catch (err) {
      console.error(err);
      alert('Failed to save campaign.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/campaigns')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Campaigns
      </button>
      <div className="flex items-center gap-3 mb-6">
         <Scroll className="w-8 h-8" style={{ color: 'var(--accent)' }} />
         <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>New Campaign</h1>
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
        <div className="pt-4 flex justify-end">
           <button type="submit" disabled={isSubmitting || !formData.name.trim()} className="btn-primary flex items-center gap-2">
             <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Create Campaign'}
           </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { Wand2, ChevronLeft, Save } from 'lucide-react';

export function HomebrewBuilderPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Spell',
    description: '',
    isPublic: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/homebrew', {
        name: formData.name,
        type: formData.type.toLowerCase(),
        description: formData.description,
        is_public: formData.isPublic,
        content: {},
        version: '1.0'
      });
      navigate('/homebrew');
    } catch (err) {
      console.error(err);
      alert('Failed to save homebrew.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/homebrew')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Workshop
      </button>
      <div className="flex items-center gap-3 mb-6">
         <Wand2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
         <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Homebrew</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="label">Creation Name</label>
             <input required type="text" className="input" placeholder="e.g. Sword of Truth" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div>
             <label className="label">Category</label>
             <CustomSelect
               value={formData.type}
               onChange={(val) => setFormData({ ...formData, type: val })}
               options={[
                 'Spell', 'Monster', 'Item', 'Class', 'Subclass', 
                 'Race', 'Background', 'Feat', 'Rule'
               ].map(t => ({ value: t, label: t }))}
               className="capitalize"
             />
           </div>
        </div>
        <div>
          <label className="label">Description / Rules</label>
          <textarea rows={5} className="input resize-none" placeholder="Describe mechanics and flavor..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
        </div>
        <div className="pt-4 flex justify-end">
           <button type="submit" disabled={isSubmitting || !formData.name.trim()} className="btn-primary flex items-center gap-2">
             <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Publish Homebrew'}
           </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { Shield, ChevronLeft, Save, Upload } from 'lucide-react';
import { DND_CLASSES, DND_RACES, capitalize } from '@/lib/utils.js';

export function CharacterBuilderPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', race: 'human', class: 'fighter', level: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const rootNode = JSON.parse(text);
        if (!rootNode.data) throw new Error("Could not find 'data' in imported LSS JSON");
        
        const lss = typeof rootNode.data === 'string' ? JSON.parse(rootNode.data) : rootNode.data;
        
        const importedName = lss.name?.value || "Imported Character";
        const importedClass = lss.info?.charClass?.value || 'fighter';
        const importedRace = lss.info?.race?.value || 'human';
        const importedLevel = Number(lss.info?.level?.value) || 1;
        
        setFormData({
          name: importedName,
          race: importedRace,
          class: importedClass,
          level: importedLevel
        });
        
        if (confirm(`Successfully parsed ${importedName}! Save immediately?`)) {
          setIsSubmitting(true);
          try {
            await api.post('/characters', {
              name: importedName,
              race_id: importedRace.toLowerCase().replace(/ /g, '-'),
              race_name: importedRace,
              background_id: lss.info?.background?.value?.toLowerCase() || 'bg-1',
              background_name: lss.info?.background?.value || 'Unknown',
              alignment: lss.info?.alignment?.value || 'true neutral',
              classes: [{ class_id: importedClass.toLowerCase().replace(/ /g, '-'), class_name: importedClass, level: importedLevel }],
              total_level: importedLevel,
              ability_scores: { 
                str: lss.stats?.str?.score || 10, 
                dex: lss.stats?.dex?.score || 10, 
                con: lss.stats?.con?.score || 10, 
                int: lss.stats?.int?.score || 10, 
                wis: lss.stats?.wis?.score || 10, 
                cha: lss.stats?.cha?.score || 10 
              },
              max_hit_points: lss.vitality?.['hp-max']?.value || (10 * importedLevel),
              current_hit_points: lss.vitality?.['hp-current']?.value || (10 * importedLevel),
              hit_dice_total: `${importedLevel}d8`,
              armor_class: lss.vitality?.ac?.value || 10,
              proficiency_bonus: lss.proficiency || Math.floor(2 + (importedLevel - 1) / 4)
            });
            navigate('/characters');
          } catch (err) {
            console.error("LSS Save Error:", err);
            alert('Failed to save imported character to database.');
          } finally {
            setIsSubmitting(false);
          }
        }
      } catch (err) {
        console.error("LSS Parse Error:", err);
        alert("Failed to parse JSON file. Ensure it's a valid Long Story Short v2 export.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/characters', {
        name: formData.name,
        race_id: formData.race.toLowerCase(),
        race_name: capitalize(formData.race),
        background_id: 'bg-1',
        background_name: 'Acolyte',
        alignment: 'true neutral',
        classes: [{ class_id: formData.class.toLowerCase(), class_name: capitalize(formData.class), level: Number(formData.level) }],
        total_level: Number(formData.level),
        ability_scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        max_hit_points: 10 * Number(formData.level),
        current_hit_points: 10 * Number(formData.level),
        hit_dice_total: `${formData.level}d8`,
        armor_class: 10,
        proficiency_bonus: Math.floor(2 + (Number(formData.level) - 1) / 4)
      });
      navigate('/characters');
    } catch (err) {
      console.error(err);
      alert('Failed to save character.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate('/characters')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Characters
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <Shield className="w-8 h-8" style={{ color: 'var(--accent)' }} />
           <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Character</h1>
        </div>
        
        <div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()} 
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import LSS JSON
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Character Name</label>
          <input required type="text" className="input" placeholder="e.g. Gandalf" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Race</label>
                <CustomSelect
                  value={formData.race}
                  onChange={(val) => setFormData({ ...formData, race: val })}
                  options={DND_RACES.map(r => ({ value: r, label: capitalize(r) }))}
                />
              </div>
              <div>
                <label className="label">Class</label>
                <CustomSelect
                  value={formData.class}
                  onChange={(val) => setFormData({ ...formData, class: val })}
                  options={DND_CLASSES.map(c => ({ value: c, label: capitalize(c) }))}
                />
              </div>
        </div>
        <div>
           <label className="label">Level</label>
           <input required type="number" min={1} max={20} className="input w-32" value={formData.level} onChange={e => setFormData({...formData, level: Number(e.target.value)})} />
        </div>
        <div className="pt-4 flex justify-end">
           <button type="submit" disabled={isSubmitting || !formData.name.trim()} className="btn-primary flex items-center gap-2">
             <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Character'}
           </button>
        </div>
      </form>
    </div>
  );
}

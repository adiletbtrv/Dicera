import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { Shield, ChevronLeft, Save, Upload } from 'lucide-react';
import { DND_CLASSES, DND_RACES, capitalize } from '@/lib/utils.js';
import { z } from 'zod';
import { useToastStore } from '@/store/toast.js';

const LssSchema = z.object({
  name: z.object({ value: z.string() }).passthrough().optional(),
  info: z.object({
    charClass: z.object({ value: z.string() }).passthrough().optional(),
    race: z.object({ value: z.string() }).passthrough().optional(),
    level: z.object({ value: z.union([z.string(), z.number()]) }).passthrough().optional(),
    background: z.object({ value: z.string() }).passthrough().optional(),
    alignment: z.object({ value: z.string() }).passthrough().optional(),
  }).passthrough().optional(),
  stats: z.object({
    str: z.object({ score: z.number().optional() }).passthrough().optional(),
    dex: z.object({ score: z.number().optional() }).passthrough().optional(),
    con: z.object({ score: z.number().optional() }).passthrough().optional(),
    int: z.object({ score: z.number().optional() }).passthrough().optional(),
    wis: z.object({ score: z.number().optional() }).passthrough().optional(),
    cha: z.object({ score: z.number().optional() }).passthrough().optional()
  }).passthrough().optional(),
  vitality: z.object({
    'hp-max': z.object({ value: z.number().optional() }).passthrough().optional(),
    'hp-current': z.object({ value: z.number().optional() }).passthrough().optional(),
    ac: z.object({ value: z.number().optional() }).passthrough().optional(),
  }).passthrough().optional(),
  proficiency: z.number().optional(),
}).passthrough();
export function CharacterBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', race: 'human', class: 'fighter', level: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastStore((s) => s.add);

  useEffect(() => {
    if (id) {
      api.get<{ name: string; race_name: string; classes: { class_name: string; level: number }[] }>(`/characters/${id}`)
         .then((char) => {
            const cls = char.classes?.[0];
            setFormData({
              name: char.name,
              race: char.race_name.toLowerCase(),
              class: cls ? cls.class_name.toLowerCase() : 'fighter',
              level: cls ? cls.level : 1
            });
         })
         .catch(console.error);
    }
  }, [id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const rootNode = JSON.parse(text);
        if (!rootNode.data) throw new Error("Could not find 'data' in imported LSS JSON");
        
        const rawData = typeof rootNode.data === 'string' ? JSON.parse(rootNode.data) : rootNode.data;
        const lss = LssSchema.parse(rawData);
        
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
        
        toast({ type: 'success', message: `Parsed ${importedName}! Saving to database...`, duration: 3000 });
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
          toast({ type: 'success', message: 'Character imported successfully!', duration: 3000 });
          navigate('/characters');
        } catch (err) {
          console.error("LSS Save Error:", err);
          toast({ type: 'error', message: 'Failed to save imported character to database.', duration: 5000 });
        } finally {
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("LSS Parse Error:", err);
        toast({ type: 'error', message: "Failed to parse JSON file. Ensure it's a valid Long Story Short v2 export.", duration: 5000 });
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
      if (id) {
        await api.patch(`/characters/${id}`, {
          name: formData.name,
          race_id: formData.race.toLowerCase(),
          race_name: capitalize(formData.race),
          classes: [{ class_id: formData.class.toLowerCase(), class_name: capitalize(formData.class), level: Number(formData.level) }],
          total_level: Number(formData.level)
        });
        navigate(`/characters/${id}`);
      } else {
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
      }
    } catch (err) {
      console.error(err);
      toast({ type: 'error', message: 'Failed to save character.', duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate(id ? `/characters/${id}` : '/characters')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <Shield className="w-8 h-8" style={{ color: 'var(--accent)' }} />
           <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{id ? 'Edit Character' : 'Create Character'}</h1>
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
             <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : (id ? 'Save Changes' : 'Create Character')}
           </button>
        </div>
      </form>
    </div>
  );
}


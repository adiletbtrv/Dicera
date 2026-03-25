import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Wand2, ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toast';

type HomebrewType = 'spell' | 'monster' | 'item' | 'class' | 'subclass' | 'race' | 'background' | 'feat' | 'rule';

interface SpellContent { level: string | number; school: string; casting_time: string; range: string; components: string; duration: string; concentration: boolean }
interface MonsterContent { challenge_rating: string; creature_type: string; hit_dice: string; ac: string | number; speed: string }
interface ItemContent { rarity: string; item_type: string; requires_attunement: boolean }

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'spell', label: 'Spell' }, { value: 'monster', label: 'Monster' },
  { value: 'item', label: 'Item' }, { value: 'class', label: 'Class' },
  { value: 'subclass', label: 'Subclass' }, { value: 'race', label: 'Race' },
  { value: 'background', label: 'Background' }, { value: 'feat', label: 'Feat' },
  { value: 'rule', label: 'Rule / Table' },
];

function SpellFields({ value, onChange }: { value: SpellContent; onChange: (v: SpellContent) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {([['level', 'Level (0-9)', 'number'], ['school', 'School', 'text'], ['casting_time', 'Casting Time', 'text'], ['range', 'Range', 'text'], ['components', 'Components (V, S, M)', 'text'], ['duration', 'Duration', 'text']] as const).map(([key, label, type]) => (
        <div key={key}>
          <label className="label text-xs">{label}</label>
          <input type={type} className="input uppercase" value={value[key as keyof SpellContent] as string} onChange={(e) => onChange({ ...value, [key]: type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value })} />
        </div>
      ))}
      <div className="flex items-center gap-2 col-span-2 md:col-span-3">
        <input type="checkbox" id="conc" checked={value.concentration} onChange={(e) => onChange({ ...value, concentration: e.target.checked })} className="checkbox" />
        <label htmlFor="conc" className="text-sm font-ui" style={{ color: 'var(--text-secondary)' }}>Requires Concentration</label>
      </div>
    </div>
  );
}

function MonsterFields({ value, onChange }: { value: MonsterContent; onChange: (v: MonsterContent) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {([['challenge_rating', 'Challenge Rating'], ['creature_type', 'Creature Type'], ['hit_dice', 'Hit Dice (e.g. 8d10)'], ['speed', 'Speed (e.g. 30 ft)']] as const).map(([key, label]) => (
        <div key={key}>
          <label className="label text-xs">{label}</label>
          <input className="input" value={value[key as keyof MonsterContent] as string} onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
        </div>
      ))}
      <div>
        <label className="label text-xs">Armor Class</label>
        <input type="number" className="input" value={value.ac} onChange={(e) => onChange({ ...value, ac: e.target.value === '' ? '' : +e.target.value })} />
      </div>
    </div>
  );
}

function ItemFields({ value, onChange }: { value: ItemContent; onChange: (v: ItemContent) => void }) {
  // Automatically capitalize words like "Very Rare"
  const rarityOptions = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].map(r => ({
    value: r,
    label: r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label text-xs">Rarity</label>
        <CustomSelect value={value.rarity} onChange={(v) => onChange({ ...value, rarity: v })} options={rarityOptions} />
      </div>
      <div>
        <label className="label text-xs">Item Type</label>
        <input className="input" placeholder="e.g. Weapon, Armor, Wondrous..." value={value.item_type} onChange={(e) => onChange({ ...value, item_type: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="attune" checked={value.requires_attunement} onChange={(e) => onChange({ ...value, requires_attunement: e.target.checked })} className="checkbox" />
        <label htmlFor="attune" className="text-sm font-ui" style={{ color: 'var(--text-secondary)' }}>Requires Attunement</label>
      </div>
    </div>
  );
}

export function HomebrewBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore((s) => s.add);

  const [type, setType] = useState<HomebrewType>('spell');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [spellContent, setSpellContent] = useState<SpellContent>({ level: '', school: '', casting_time: '', range: '', components: '', duration: '', concentration: false });
  const [monsterContent, setMonsterContent] = useState<MonsterContent>({ challenge_rating: '', creature_type: '', hit_dice: '', ac: '', speed: '' });
  const [itemContent, setItemContent] = useState<ItemContent>({ rarity: 'uncommon', item_type: '', requires_attunement: false });

  useEffect(() => {
    if (id) {
      api.get<any>(`/homebrew/${id}`).then((res) => {
        setName(res.name);
        setType(res.type as HomebrewType);
        setDescription(res.description || '');
        setIsPublic(res.is_public);
        setTags(res.tags || []);
        if (res.type === 'spell') setSpellContent(res.content);
        if (res.type === 'monster') setMonsterContent(res.content);
        if (res.type === 'item') setItemContent(res.content);
      }).catch(() => toast({ type: 'error', message: 'Failed to load homebrew for editing', duration: 3000 }));
    }
  }, [id, toast]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); }
    setTagInput('');
  }

  function validate() {
    if (!name.trim()) { toast({ type: 'error', message: 'Name is required.', duration: 3000 }); return false; }

    if (type === 'spell') {
      const compStr = spellContent.components.toUpperCase();
      // Only allow V, S, M, spaces, commas, and parentheses for materials
      const baseComps = compStr.replace(/\(.*?\)/g, '');
      if (/[^VSM\s,]/.test(baseComps)) {
        toast({ type: 'error', message: 'Spell components can only contain V, S, M (and material descriptions inside parentheses).', duration: 5000 });
        return false;
      }
      if (spellContent.level === '' || !spellContent.school || !spellContent.casting_time) {
        toast({ type: 'error', message: 'Please fill out all required spell fields.', duration: 3000 });
        return false;
      }
    }
    return true;
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error('Validation failed');
      const content = type === 'spell' ? spellContent : type === 'monster' ? monsterContent : type === 'item' ? itemContent : {};
      const payload = { name, type, description, is_public: isPublic, content, tags, version: '1.0' };

      if (id) return api.patch(`/homebrew/${id}`, payload);
      return api.post('/homebrew', payload);
    },
    onSuccess: () => {
      toast({ type: 'success', message: id ? 'Homebrew updated!' : 'Homebrew created!', duration: 3000 });
      navigate('/homebrew');
    },
    onError: (e: any) => {
      if (e.message !== 'Validation failed') toast({ type: 'error', message: 'Failed to save homebrew', duration: 3000 });
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/homebrew')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Workshop
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Wand2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold">{id ? 'Edit Homebrew' : 'Create Homebrew'}</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4">
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input required className="input" placeholder="e.g. Sword of Truth" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <CustomSelect value={type} onChange={(v) => setType(v as HomebrewType)} options={TYPE_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="label">Description / Rules</label>
            <textarea rows={4} className="input resize-none" placeholder="Describe mechanics and flavor text..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs font-ui px-2 py-1 rounded-full" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {t}
                  <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <button type="button" onClick={addTag} className="btn-secondary flex items-center gap-1 text-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="checkbox" />
            <label htmlFor="pub" className="text-sm font-ui" style={{ color: 'var(--text-secondary)' }}>Make public (share with community)</label>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(type === 'spell' || type === 'monster' || type === 'item') && (
            <motion.div key={type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card">
              <h2 className="font-heading font-semibold mb-4 capitalize">{type} Properties</h2>
              {type === 'spell' && <SpellFields value={spellContent} onChange={setSpellContent} />}
              {type === 'monster' && <MonsterFields value={monsterContent} onChange={setMonsterContent} />}
              {type === 'item' && <ItemFields value={itemContent} onChange={setItemContent} />}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button type="submit" disabled={saveMut.isPending} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saveMut.isPending ? 'Saving...' : (id ? 'Save Changes' : 'Publish Homebrew')}
          </button>
        </div>
      </form>
    </div>
  );
}
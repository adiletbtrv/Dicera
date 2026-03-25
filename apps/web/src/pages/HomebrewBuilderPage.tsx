import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { CustomSelect } from '@/components/ui/CustomSelect.js';
import { Wand2, ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toast.js';

type HomebrewType = 'spell' | 'monster' | 'item' | 'class' | 'subclass' | 'race' | 'background' | 'feat' | 'rule';

interface SpellContent { level: number; school: string; casting_time: string; range: string; components: string; duration: string; concentration: boolean }
interface MonsterContent { challenge_rating: string; creature_type: string; hit_dice: string; ac: number; speed: string }
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
          <input type={type} className="input" value={value[key] as string} onChange={(e) => onChange({ ...value, [key]: type === 'number' ? +e.target.value : e.target.value })} />
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
        <input type="number" className="input" value={value.ac} onChange={(e) => onChange({ ...value, ac: +e.target.value })} />
      </div>
    </div>
  );
}

function ItemFields({ value, onChange }: { value: ItemContent; onChange: (v: ItemContent) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label text-xs">Rarity</label>
        <CustomSelect value={value.rarity} onChange={(v) => onChange({ ...value, rarity: v })} options={['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].map((r) => ({ value: r, label: r }))} />
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
  const navigate = useNavigate();
  const toast = useToastStore((s) => s.add);
  const [type, setType] = useState<HomebrewType>('spell');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [spellContent, setSpellContent] = useState<SpellContent>({ level: 0, school: '', casting_time: '1 action', range: '30 feet', components: 'V, S', duration: 'Instantaneous', concentration: false });
  const [monsterContent, setMonsterContent] = useState<MonsterContent>({ challenge_rating: '1', creature_type: 'Beast', hit_dice: '4d8', ac: 13, speed: '30 ft' });
  const [itemContent, setItemContent] = useState<ItemContent>({ rarity: 'uncommon', item_type: 'Wondrous Item', requires_attunement: false });

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); }
    setTagInput('');
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const content = type === 'spell' ? spellContent : type === 'monster' ? monsterContent : type === 'item' ? itemContent : {};
      return api.post('/homebrew', { name, type, description, is_public: isPublic, content, tags, version: '1.0' });
    },
    onSuccess: () => {
      toast({ type: 'success', message: 'Homebrew created!', duration: 3000 });
      navigate('/homebrew');
    },
    onError: () => toast({ type: 'error', message: 'Failed to save homebrew', duration: 3000 }),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/homebrew')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Workshop
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Wand2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold">Create Homebrew</h1>
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
          <button type="submit" disabled={saveMut.isPending || !name.trim()} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saveMut.isPending ? 'Publishing...' : 'Publish Homebrew'}
          </button>
        </div>
      </form>
    </div>
  );
}

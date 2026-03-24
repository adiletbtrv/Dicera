import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, Shield, Heart, Zap, Award, Scroll, Swords, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { abilityModifier, formatModifier, capitalize } from '@/lib/utils.js';
import { useToastStore } from '@/store/toast.js';

interface DbCharacter {
  id: string;
  name: string;
  race_name: string;
  background_name: string;
  alignment: string;
  total_level: number;
  classes: { class_name: string; level: number }[];
  ability_scores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  max_hit_points: number;
  current_hit_points: number;
  armor_class: number;
  speed: number;
  proficiency_bonus: number;
  spell_slots?: { level: number; total: number; used: number }[];
  saving_throw_proficiencies?: string[];
  skill_proficiencies?: string[];
  features?: { name: string; description: string }[];
  notes?: string;
  avatar_url?: string;
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const SKILLS = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
] as const;

const SAVE_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const TABS = ['Overview', 'Skills', 'Spells', 'Features', 'Notes'] as const;
type Tab = (typeof TABS)[number];

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct >= 60 ? '#22c55e' : pct >= 30 ? 'var(--gold)' : 'var(--dragon)';
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
      <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editHp, setEditHp] = useState(false);
  const [hpInput, setHpInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['character', id],
    queryFn: () => api.get<DbCharacter>(`/characters/${id}`),
    enabled: !!id,
  });

  const updateHpMut = useMutation({
    mutationFn: (hp: number) => api.patch(`/characters/${id}`, { current_hit_points: hp }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['character', id] });
      setEditHp(false);
      toast({ type: 'success', message: 'HP updated', duration: 2000 });
    },
    onError: () => toast({ type: 'error', message: 'Failed to update HP', duration: 3000 }),
  });

  if (isLoading) return <div className="text-center py-12 font-ui" style={{ color: 'var(--text-muted)' }}>Loading character...</div>;
  if (!data) return <div className="text-center py-12 font-ui" style={{ color: 'var(--dragon)' }}>Character not found.</div>;

  const stats = data.ability_scores ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const charClassStr = data.classes?.map((c) => `${c.class_name} ${c.level}`).join(' / ') ?? 'Unknown';
  const prof = data.proficiency_bonus ?? 2;
  const skillProfs = new Set((data.skill_proficiencies ?? []).map((s) => s.toLowerCase()));
  const saveProfs = new Set((data.saving_throw_proficiencies ?? []).map((s) => s.toLowerCase()));
  const spellSlots = data.spell_slots?.filter((s) => s.total > 0) ?? [];

  function skillBonus(skillName: string, abilityKey: typeof ABILITY_KEYS[number]) {
    const mod = abilityModifier(stats[abilityKey] ?? 10);
    const isProficient = skillProfs.has(skillName.toLowerCase());
    return mod + (isProficient ? prof : 0);
  }

  function saveBonus(ability: string) {
    const mod = abilityModifier(stats[ability as keyof typeof stats] ?? 10);
    return mod + (saveProfs.has(ability.toLowerCase()) ? prof : 0);
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle at top right, var(--accent) 0%, transparent 40%)' }} />

      <button onClick={() => navigate('/characters')} className="btn-ghost mb-6 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Characters
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl p-8 mb-6 overflow-hidden shadow-2xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 relative z-10">
          <div>
            <h1 className="font-heading font-black text-5xl tracking-tight" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #ddd6fe 50%, var(--gold2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {data.name}
            </h1>
            <p className="text-sm font-ui font-bold tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
              Level <span style={{ color: 'var(--accent)' }}>{data.total_level}</span> {data.race_name} &bull; {charClassStr} &bull; {data.background_name}
            </p>
          </div>
          <button onClick={() => navigate(`/characters/${id}/edit`)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Combat Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Shield, label: 'Armor Class', value: data.armor_class ?? 10, color: 'var(--teal)' },
          { icon: Zap, label: 'Initiative', value: formatModifier(abilityModifier(stats.dex ?? 10)), color: 'var(--gold)' },
          { icon: Award, label: 'Proficiency', value: `+${prof}`, color: 'var(--accent)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center py-5">
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
            <p className="font-heading font-black text-4xl" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs font-ui uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
        <div className="card py-5">
          <Heart className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--dragon)' }} />
          <div className="flex items-center justify-center gap-1">
            {editHp ? (
              <>
                <input autoFocus type="number" className="input text-center font-heading font-black text-2xl w-20 p-1" defaultValue={data.current_hit_points} onChange={(e) => setHpInput(e.target.value)} />
                <button onClick={() => updateHpMut.mutate(parseInt(hpInput || String(data.current_hit_points)))} className="p-1 rounded-lg text-green-400"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditHp(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
              </>
            ) : (
              <button onClick={() => { setEditHp(true); setHpInput(String(data.current_hit_points)); }} className="flex items-center gap-1 group">
                <p className="font-heading font-black text-4xl" style={{ color: 'var(--dragon)' }}>{data.current_hit_points}</p>
                <span style={{ color: 'var(--text-muted)' }}>/{data.max_hit_points}</span>
              </button>
            )}
          </div>
          <HpBar current={data.current_hit_points ?? 0} max={data.max_hit_points ?? 1} />
          <p className="text-xs font-ui uppercase tracking-wider mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Hit Points</p>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {ABILITY_KEYS.map((key) => {
          const score = stats[key] ?? 10;
          const mod = abilityModifier(score);
          return (
            <div key={key} className="card text-center py-4 hover:-translate-y-1 transition-transform cursor-default" style={{ borderColor: mod >= 0 ? undefined : 'var(--dragon)' }}>
              <p className="text-xs font-ui font-black tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{key.toUpperCase()}</p>
              <p className="font-heading font-black text-4xl" style={{ color: 'var(--text-primary)' }}>{score}</p>
              <p className={`text-sm font-bold font-ui mt-1 px-2 py-0.5 rounded-full ${mod >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                {formatModifier(mod)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-4 py-2 text-sm font-ui font-medium transition-colors"
            style={{ color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="char-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: 'var(--accent)' }} />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Saving Throws */}
              <div className="card">
                <h3 className="font-heading font-semibold mb-3">Saving Throws</h3>
                <div className="space-y-2">
                  {SAVE_ABILITIES.map((ab) => {
                    const bonus = saveBonus(ab);
                    const isProficient = saveProfs.has(ab.toLowerCase());
                    return (
                      <div key={ab} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isProficient ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`} />
                        <span className="text-sm font-ui flex-1 uppercase">{ab}</span>
                        <span className="font-bold text-sm" style={{ color: bonus >= 0 ? 'var(--teal2)' : 'var(--dragon)' }}>{formatModifier(bonus)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Info */}
              <div className="card">
                <h3 className="font-heading font-semibold mb-3">Info</h3>
                <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Alignment</span><span>{capitalize(data.alignment ?? 'Unaligned')}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Background</span><span>{data.background_name}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Speed</span><span>{data.speed ?? 30} ft</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Proficiency Bonus</span><span>+{prof}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Skills' && (
            <div className="card">
              <h3 className="font-heading font-semibold mb-3">Skill Checks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {SKILLS.map((skill) => {
                  const bonus = skillBonus(skill.name, skill.ability as typeof ABILITY_KEYS[number]);
                  const isProficient = skillProfs.has(skill.name.toLowerCase());
                  return (
                    <div key={skill.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isProficient ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`} />
                      <span className="text-sm font-ui flex-1">{skill.name}</span>
                      <span className="text-xs font-ui uppercase" style={{ color: 'var(--text-muted)' }}>{skill.ability.toUpperCase()}</span>
                      <span className="font-bold text-sm w-8 text-right" style={{ color: bonus >= 0 ? 'var(--teal2)' : 'var(--dragon)' }}>{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Spells' && (
            <div>
              {spellSlots.length === 0 ? (
                <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Scroll className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No spell slots — this character is not a spellcaster, or slots haven't been assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {spellSlots.map((slot) => {
                    const remaining = slot.total - slot.used;
                    return (
                      <div key={slot.level} className="card text-center py-4">
                        <p className="text-xs font-ui uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Level {slot.level}</p>
                        <div className="flex justify-center gap-1 flex-wrap mb-2">
                          {Array.from({ length: slot.total }).map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded-full transition-all" style={{ background: i < remaining ? 'var(--accent)' : 'var(--surface-raised)', border: '1px solid var(--border)' }} />
                          ))}
                        </div>
                        <p className="font-heading font-bold" style={{ color: remaining === 0 ? 'var(--dragon)' : 'var(--text-primary)' }}>{remaining}/{slot.total}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Features' && (
            <div className="card">
              <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Features & Traits
              </h3>
              {!data.features || data.features.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No features recorded. Edit the character to add racial traits and class features.</p>
              ) : (
                <div className="space-y-4">
                  {data.features.map((f) => (
                    <div key={f.name}>
                      <h4 className="font-ui font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>{f.name}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="card">
              <h3 className="font-heading font-semibold mb-3">Adventurer's Notes</h3>
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: data.notes ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                {data.notes ?? 'No notes yet. Edit the character to add backstory, session notes, and more.'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

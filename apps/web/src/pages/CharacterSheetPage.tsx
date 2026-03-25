import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, Shield, Heart, Zap, Award, Scroll, Swords, Edit2, Check, X, Skull } from 'lucide-react';
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

const ABILITY_LABELS: Record<string, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const SKILLS = [
  { name: 'Acrobatics', ability: 'dex' }, { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' }, { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' }, { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' }, { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' }, { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' }, { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' }, { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' }, { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' }, { name: 'Survival', ability: 'wis' },
] as const;

const SAVE_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const TABS = ['Overview', 'Skills', 'Spells', 'Features', 'Notes'] as const;
type Tab = (typeof TABS)[number];

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct >= 60 ? 'var(--success)' : pct >= 30 ? 'var(--gold)' : 'var(--red)';
  return (
    <div className="relative h-7 rounded-full overflow-hidden my-2 border border-[var(--border)]" style={{ background: 'var(--bg3)' }}>
      <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="absolute top-0 bottom-0 left-0 rounded-full" style={{ background: color }}>
        <div className="absolute top-1 left-2 right-2 h-1 rounded-sm bg-white/20" />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-sm text-white drop-shadow-md tracking-wider">
        {current} / {max}
      </div>
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
    mutationFn: (hp: number) => api.patch(`/characters/${id}`, { current_hit_points: Math.max(0, hp) }),
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
    <div className="max-w-4xl mx-auto pb-20">
      <button onClick={() => navigate('/characters')} className="btn-ghost mb-4 flex items-center gap-1 text-xs">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Header aligned to Amon Fudo .header */}
      <div className="text-center pb-6 border-b border-[var(--border)] mb-6 mt-2 relative">
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-wide mb-1" style={{ background: 'linear-gradient(135deg, var(--purple2) 0%, var(--purple3) 50%, var(--gold2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.3))' }}>
          {data.name}
        </h1>
        <p className="font-ui text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[var(--muted)]">
          Level <span className="text-[var(--purple2)]">{data.total_level}</span> {data.race_name} &bull; {charClassStr}
        </p>
        <button onClick={() => navigate(`/characters/${id}/edit`)} className="absolute right-0 top-0 btn-secondary p-2 rounded-lg" title="Edit Character">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Combat & Vitals (Big numbers + HP) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="text-center bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-3 px-2">
          <p className="font-ui text-[0.58rem] font-bold tracking-[0.18em] uppercase text-[var(--muted)] mb-1">Armor Class</p>
          <p className="font-heading font-black text-3xl text-[var(--teal2)] leading-none">{data.armor_class ?? 10}</p>
        </div>
        <div className="text-center bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-3 px-2">
          <p className="font-ui text-[0.58rem] font-bold tracking-[0.18em] uppercase text-[var(--muted)] mb-1">Initiative</p>
          <p className="font-heading font-black text-3xl text-[var(--gold2)] leading-none">{formatModifier(abilityModifier(stats.dex ?? 10))}</p>
        </div>
        <div className="text-center bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-3 px-2">
          <p className="font-ui text-[0.58rem] font-bold tracking-[0.18em] uppercase text-[var(--muted)] mb-1">Speed</p>
          <p className="font-heading font-black text-3xl text-[var(--text)] leading-none">{data.speed ?? 30}<span className="text-sm text-[var(--muted)]">ft</span></p>
        </div>
        <div className="text-center bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-3 px-2">
          <p className="font-ui text-[0.58rem] font-bold tracking-[0.18em] uppercase text-[var(--muted)] mb-1">Proficiency</p>
          <p className="font-heading font-black text-3xl text-[var(--purple2)] leading-none">+{prof}</p>
        </div>

        {/* HP Block spans 2 or 4 cols depending on screen */}
        <div className="col-span-2 sm:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1 relative z-10">
            <p className="font-ui text-xs font-bold tracking-widest uppercase text-[var(--muted)] flex items-center gap-1"><Heart className="w-3 h-3 text-[var(--red2)]" /> Hit Points</p>
            {editHp ? (
              <div className="flex items-center gap-1">
                <input autoFocus type="number" className="input text-center font-heading font-black text-lg w-16 px-1 py-0.5" defaultValue={data.current_hit_points} onChange={(e) => setHpInput(e.target.value)} />
                <button onClick={() => updateHpMut.mutate(parseInt(hpInput || String(data.current_hit_points)))} className="p-1 rounded bg-[var(--success)]/20 text-[var(--success)]"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditHp(false)} className="p-1 rounded bg-[var(--muted)]/20 text-[var(--text)]"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => { setEditHp(true); setHpInput(String(data.current_hit_points)); }} className="font-heading font-black text-2xl text-[var(--text)] hover:text-[var(--purple2)] transition-colors">
                {data.current_hit_points}
              </button>
            )}
          </div>
          <HpBar current={data.current_hit_points ?? 0} max={data.max_hit_points ?? 1} />
        </div>
      </div>

      {/* Ability Scores Row (.g6) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {ABILITY_KEYS.map((key) => {
          const score = stats[key] ?? 10;
          const mod = abilityModifier(score);
          const isSaveProf = saveProfs.has(key);
          return (
            <div key={key} className={`bg-[var(--bg3)] border ${mod >= 3 ? 'border-[var(--border2)] shadow-[0_0_12px_rgba(139,92,246,0.2)]' : 'border-[var(--border)]'} rounded-xl py-3 px-1 text-center select-none transition-colors hover:border-[var(--border2)]`}>
              <p className="font-ui text-[0.55rem] font-bold tracking-[0.18em] uppercase text-[var(--muted)] mb-1">{key}</p>
              <p className="font-heading font-black text-2xl text-[var(--purple3)] leading-none">{score}</p>
              <p className={`font-heading font-bold text-lg mt-1 ${mod > 0 ? 'text-[var(--teal2)]' : mod < 0 ? 'text-[var(--red2)]' : 'text-[var(--muted)]'}`}>
                {formatModifier(mod)}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isSaveProf ? 'bg-[var(--gold)] shadow-[0_0_4px_var(--gold)]' : 'bg-[var(--border)]'}`} title={isSaveProf ? `${ABILITY_LABELS[key]} Save Proficiency` : ''} />
                <span className="font-ui text-[0.6rem] text-[var(--muted)]">{formatModifier(saveBonus(key))}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Amon Fudo Sticky Tabs */}
      <div className="sticky top-0 bg-[var(--bg2)]/90 backdrop-blur z-40 border-b border-[var(--border)] mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex overflow-x-auto gap-2 pb-px hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-ui text-[0.7rem] font-bold tracking-[0.1em] uppercase px-4 py-3 whitespace-nowrap relative transition-colors ${activeTab === tab ? 'text-[var(--purple2)]' : 'text-[var(--muted)] hover:text-[var(--purple2)]'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="amon-tab" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t bg-[var(--purple)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent opacity-50" />
                <h3 className="font-ui text-[0.65rem] font-extrabold tracking-[0.25em] uppercase text-[var(--purple2)] mb-3 flex items-center gap-2">
                  Saving Throws <div className="flex-1 h-px bg-[var(--border)]" />
                </h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {SAVE_ABILITIES.map((ab) => {
                    const bonus = saveBonus(ab);
                    const isProf = saveProfs.has(ab.toLowerCase());
                    return (
                      <div key={ab} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg3)] border border-[var(--border)]">
                        <div className={`w-2.5 h-2.5 rounded-full border border-[var(--muted)] flex-shrink-0 ${isProf ? 'bg-[var(--purple)] border-[var(--purple2)] shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''}`} />
                        <span className="text-[0.8rem] font-ui uppercase text-[var(--text)] flex-1">{ab}</span>
                        <span className={`font-heading font-bold text-sm ${bonus > 0 ? 'text-[var(--gold)]' : bonus < 0 ? 'text-[var(--red2)]' : 'text-[var(--muted)]'}`}>{formatModifier(bonus)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent opacity-50" />
                <h3 className="font-ui text-[0.65rem] font-extrabold tracking-[0.25em] uppercase text-[var(--purple2)] mb-3 flex items-center gap-2">
                  Roleplay Info <div className="flex-1 h-px bg-[var(--border)]" />
                </h3>
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {[
                      ['Alignment', capitalize(data.alignment || 'Neutral')],
                      ['Background', data.background_name],
                      ['Race', data.race_name],
                    ].map(([lbl, val], i) => (
                      <tr key={lbl}>
                        <td className={`py-2 text-[0.65rem] font-ui font-bold tracking-[0.15em] uppercase text-[var(--muted)] ${i > 0 ? 'border-t border-[var(--border)]/50' : ''} w-2/5`}>{lbl}</td>
                        <td className={`py-2 text-sm font-body font-medium text-[var(--text)] ${i > 0 ? 'border-t border-[var(--border)]/50' : ''}`}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Skills' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative">
              <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent opacity-50" />
              <h3 className="font-ui text-[0.65rem] font-extrabold tracking-[0.25em] uppercase text-[var(--purple2)] mb-4 flex items-center gap-2">
                All Skills <div className="flex-1 h-px bg-[var(--border)]" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                {SKILLS.map((skill) => {
                  const bonus = skillBonus(skill.name, skill.ability as typeof ABILITY_KEYS[number]);
                  const isProf = skillProfs.has(skill.name.toLowerCase());
                  return (
                    <div key={skill.name} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--purple)]/10 transition-colors group cursor-default">
                      <div className={`w-2.5 h-2.5 rounded-full border border-[var(--muted)] flex-shrink-0 transition-colors ${isProf ? 'bg-[var(--purple)] border-[var(--purple2)] shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''}`} />
                      <span className="text-[0.85rem] font-body text-[var(--text)] flex-1">{skill.name}</span>
                      <span className="text-[0.6rem] font-ui font-bold uppercase text-[var(--muted)]">{skill.ability}</span>
                      <span className={`font-heading font-bold text-[0.85rem] w-6 text-right ${bonus > 0 ? 'text-[var(--gold)] group-hover:text-[var(--gold2)]' : bonus < 0 ? 'text-[var(--red2)]' : 'text-[var(--muted)]'}`}>{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Spells' && (
            <div>
              {spellSlots.length === 0 ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center text-[var(--muted)]">
                  <Scroll className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-body text-sm">No spell slots available for this class level.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {spellSlots.map((slot) => {
                    const remaining = slot.total - slot.used;
                    return (
                      <div key={slot.level} className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl py-3 px-2 text-center relative overflow-hidden group hover:border-[var(--border2)] transition-colors">
                        <p className="font-ui text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--muted)] mb-2">Level {slot.level}</p>
                        <div className="flex justify-center gap-1.5 flex-wrap mb-2 min-h-[16px]">
                          {Array.from({ length: slot.total }).map((_, i) => (
                            <div key={i} className={`w-3.5 h-3.5 rounded-full border ${i < remaining ? 'bg-[var(--purple)] border-[var(--purple2)] shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'bg-[var(--bg)] border-[var(--border)] opacity-40'}`} />
                          ))}
                        </div>
                        <p className={`font-heading font-black text-lg ${remaining === 0 ? 'text-[var(--red2)]' : 'text-[var(--text)]'}`}>{remaining}<span className="text-[var(--muted)] text-sm">/{slot.total}</span></p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Features' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative">
              <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent opacity-50" />
              <h3 className="font-ui text-[0.65rem] font-extrabold tracking-[0.25em] uppercase text-[var(--purple2)] mb-4 flex items-center gap-2">
                Features & Traits <div className="flex-1 h-px bg-[var(--border)]" />
              </h3>
              {!data.features || data.features.length === 0 ? (
                <p className="font-body text-sm text-[var(--muted)] italic">No features recorded.</p>
              ) : (
                <div className="space-y-3">
                  {data.features.map((f, i) => (
                    <div key={i} className="bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--border2)] transition-colors">
                      <h4 className="font-heading font-bold text-[0.85rem] text-[var(--purple2)] mb-1 flex items-center gap-2">
                        <Swords className="w-3.5 h-3.5 text-[var(--muted)]" /> {f.name}
                      </h4>
                      <p className="text-[0.8rem] text-[var(--text2)] leading-relaxed font-body">{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 relative h-64">
              <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--border2)] to-transparent opacity-50" />
              <h3 className="font-ui text-[0.65rem] font-extrabold tracking-[0.25em] uppercase text-[var(--purple2)] mb-4 flex items-center gap-2">
                Adventurer's Journal <div className="flex-1 h-px bg-[var(--border)]" />
              </h3>
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <p className={`text-[0.85rem] leading-[1.8] font-body whitespace-pre-wrap ${data.notes ? 'text-[var(--text2)]' : 'text-[var(--muted)] italic'}`}>
                  {data.notes ?? 'An empty journal awaits your story... \n\nClick the Edit button to add backstory, equipment, or session notes.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, Edit, Shield, Heart, Zap, Award } from 'lucide-react';
import { abilityModifier, formatModifier, capitalize } from '@/lib/utils.js';

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
  avatar_url?: string;
}

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ 
    queryKey: ['character', id], 
    queryFn: () => api.get<DbCharacter>(`/characters/${id}`), 
    enabled: !!id 
  });

  if (isLoading) return <div className="text-center py-12 font-ui" style={{ color: 'var(--text-muted)' }}>Weaving the threads of destiny...</div>;
  if (!data) return <div className="text-center py-12 font-ui" style={{ color: 'var(--dragon)' }}>Hero forsaken. Character not found.</div>;

  const charClassStr = data.classes?.map(c => `${c.class_name} ${c.level}`).join(' / ') || 'Unknown Class';
  const stats = data.ability_scores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  const STATS_UI = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' },
    { key: 'cha', label: 'CHA' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto pb-20 relative">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle at top right, var(--accent) 0%, transparent 40%)' }}></div>
      <button onClick={() => navigate('/characters')} className="btn-ghost mb-6 flex items-center gap-1 z-10 relative">
        <ChevronLeft className="w-4 h-4" /> Characters
      </button>


      <div className="relative rounded-3xl p-8 mb-8 overflow-hidden shadow-2xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="font-heading font-black text-5xl md:text-6xl tracking-tight" style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #ddd6fe 50%, var(--gold2, #fbbf24) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.3))'
            }}>
              {data.name}
            </h1>
            <p className="font-montserrat text-xs md:text-sm font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Level <span style={{ color: 'var(--accent)' }}>{data.total_level}</span> {data.race_name} <span style={{ color: 'var(--text-secondary)' }}>•</span> {charClassStr} <span style={{ color: 'var(--text-secondary)' }}>•</span> {data.background_name}
            </p>
          </div>
          <div>
            <button onClick={() => navigate(`/characters/${id}/edit`)} className="btn-secondary flex items-center gap-2 px-6 py-2.5 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 w-0 group-hover:w-full transition-all duration-300"></div>
              <Edit className="w-4 h-4" /> <span>Edit Setup</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        

        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_16px_rgba(139,92,246,0.2)]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Shield className="w-6 h-6 mb-2" style={{ color: 'var(--text-muted)' }} />
              <span className="font-rubik font-black text-5xl" style={{ color: 'var(--text-primary)' }}>{data.armor_class ?? 10}</span>
              <span className="font-montserrat text-xs font-bold tracking-[0.15em] uppercase mt-2" style={{ color: 'var(--text-muted)' }}>Armor Class</span>
            </div>
            

            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_16px_rgba(139,92,246,0.2)]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Heart className="w-6 h-6 mb-2" style={{ color: 'var(--dragon, #ef4444)' }} />
              <span className="font-rubik font-black text-5xl" style={{ color: 'var(--dragon, #ef4444)' }}>{data.current_hit_points ?? 10}</span>
              <span className="font-ui text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>/ {data.max_hit_points ?? 10} Max</span>
              <span className="font-montserrat text-xs font-bold tracking-[0.15em] uppercase mt-2" style={{ color: 'var(--text-muted)' }}>Hit Points</span>
            </div>
            

            <div className="rounded-2xl p-4 text-center transition-all duration-300 col-span-2 flex justify-around" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <span className="font-rubik font-bold text-2xl pb-1 block" style={{ color: 'var(--text-primary)' }}>{data.speed ?? 30} <span className="text-sm font-normal text-[var(--text-muted)]">ft</span></span>
                <span className="font-montserrat text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Walking Speed</span>
              </div>
              <div className="w-px bg-[var(--border)]"></div>
              <div>
                <span className="font-rubik font-bold text-2xl pb-1 block" style={{ color: 'var(--text-primary)' }}>{formatModifier(abilityModifier(stats.dex ?? 10))}</span>
                <span className="font-montserrat text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Initiative</span>
              </div>
              <div className="w-px bg-[var(--border)]"></div>
              <div>
                <span className="font-rubik font-bold text-2xl pb-1 block" style={{ color: 'var(--accent)' }}>+{data.proficiency_bonus ?? 2}</span>
                <span className="font-montserrat text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Proficiency</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
             <h3 className="font-montserrat text-xs font-bold tracking-widest uppercase mb-4 pb-2 border-b" style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}>Personality & Background</h3>
             <div className="space-y-3 font-ui text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
               <p><strong style={{ color: 'var(--text-primary)' }}>Alignment:</strong> {capitalize(data.alignment ?? 'Unaligned')}</p>
               <p><strong style={{ color: 'var(--text-primary)' }}>Background Info:</strong> Character data is largely structural at the moment. When integrated with full narrative notes, ideals, bonds, and flaws will manifest here.</p>
             </div>
          </div>
        </div>


        <div className="lg:col-span-8 flex flex-col gap-6">

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATS_UI.map(({ key, label }) => {
              const score = stats[key as keyof typeof stats] ?? 10;
              const mod = abilityModifier(score);
              return (
                <div key={key} className="rounded-xl flex flex-col items-center p-4 transition-all duration-200 hover:border-purple-500/50 hover:-translate-y-1 cursor-default group" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="font-montserrat text-xs font-black tracking-[0.2em] mb-2 group-hover:text-purple-400 transition-colors" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-rubik font-black text-4xl mb-1" style={{ color: 'var(--text-primary)' }}>{score}</span>
                  <div className={`font-ui font-bold text-sm px-2.5 py-0.5 rounded-full ${mod >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                    {formatModifier(mod)}
                  </div>
                </div>
              );
            })}
          </div>


          <div className="rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div className="pt-5 px-6 pb-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
               <Award className="w-4 h-4" style={{ color: 'var(--accent)' }}/>
               <h3 className="font-montserrat text-xs font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>Active Features & Traits</h3>
            </div>
            <div className="p-6 font-ui text-sm text-[var(--text-secondary)]">
              <p className="italic pb-4">No features imported or manually recorded yet. The character currently relies entirely on their raw stats and basic attacks.</p>
             
              <div className="mt-4 p-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-purple-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-[var(--text-primary)]">Developer Note: Import Connectivity</h4>
                </div>
                <p>The layout and architecture has been overhauled to support the Amon Fudo theme (Dark Purple, Glossy Stat Blocks, Accent headers). Importing a LongStoryShort JSON payload directly maps over background strings, stats, HP max values, and initializes the proper UI cards.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

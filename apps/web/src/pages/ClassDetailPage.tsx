import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClassFeature { level: number; name: string; description: string }
interface Subclass { id: string; name: string; flavor_name?: string; description: string; features?: ClassFeature[] }
interface DndClass {
  id: string; name: string; hit_die: string; description: string;
  primary_ability: string[]; saving_throw_proficiencies: string[];
  armor_proficiencies: string[]; weapon_proficiencies: string[];
  skill_choices: { choose: number; from: string[] };
  features: ClassFeature[]; source: string; page?: number;
  subclasses?: Subclass[];
}

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cls, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => api.get<DndClass>(`/classes/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!cls) return <div className="text-center py-16" style={{ color: 'var(--dragon)' }}>Class not found.</div>;

  const featuresByLevel = (cls.features ?? []).reduce<Record<number, ClassFeature[]>>((acc, f) => {
    if (!acc[f.level]) acc[f.level] = [];
    acc[f.level]!.push(f);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/classes')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Classes
      </button>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-bold text-xl flex-shrink-0" style={{ background: 'rgba(201,151,58,0.12)', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
            {cls.hit_die}
          </div>
          <div>
            <h1 className="font-heading text-4xl font-bold">{cls.name}</h1>
            <div className="flex gap-2 flex-wrap mt-2">
              {cls.primary_ability?.map((a) => <span key={a} className="badge-level">{a}</span>)}
              <span className="badge-level">{cls.source}{cls.page ? ` p.${cls.page}` : ''}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <h2 className="font-heading font-semibold mb-3">Description</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cls.description}</p>
            </div>
            {Object.keys(featuresByLevel).length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-4">Class Features</h2>
                <div className="space-y-4">
                  {Object.entries(featuresByLevel).sort(([a], [b]) => +a - +b).map(([level, features]) => (
                    <div key={level}>
                      <p className="text-xs font-ui font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Level {level}</p>
                      <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: 'var(--border)' }}>
                        {features.map((f) => (
                          <div key={f.name}>
                            <h3 className="font-ui font-semibold text-sm" style={{ color: 'var(--gold2)' }}>{f.name}</h3>
                            <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cls.subclasses && cls.subclasses.length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-4">Subclasses</h2>
                <div className="space-y-4">
                  {cls.subclasses.map((sc) => (
                    <div key={sc.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <h3 className="font-heading font-semibold">{sc.name}</h3>
                      {sc.flavor_name && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sc.flavor_name}</p>}
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{sc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-heading font-semibold mb-3">Proficiencies</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-ui uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Saving Throws</p>
                  <div className="flex flex-wrap gap-1">{cls.saving_throw_proficiencies?.map((s) => <span key={s} className="badge-level text-xs">{s}</span>)}</div>
                </div>
                {cls.armor_proficiencies?.length > 0 && (
                  <div>
                    <p className="text-xs font-ui uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Armor</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cls.armor_proficiencies.join(', ')}</p>
                  </div>
                )}
                {cls.weapon_proficiencies?.length > 0 && (
                  <div>
                    <p className="text-xs font-ui uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Weapons</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cls.weapon_proficiencies.join(', ')}</p>
                  </div>
                )}
                {cls.skill_choices && (
                  <div>
                    <p className="text-xs font-ui uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Skills (choose {cls.skill_choices.choose})</p>
                    <div className="flex flex-wrap gap-1">{cls.skill_choices.from?.map((s) => <span key={s} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

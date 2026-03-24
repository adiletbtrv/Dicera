import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface RaceTrait { name: string; description: string }
interface Subrace { name: string; description: string; ability_score_increases?: Record<string, number>; traits?: RaceTrait[] }
interface Race {
  id: string; name: string; size: string; speed: number; source: string; page?: number;
  ability_score_increases: Record<string, number>;
  traits: RaceTrait[]; subraces: Subrace[]; languages: string[];
}

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: race, isLoading } = useQuery({
    queryKey: ['race', id],
    queryFn: () => api.get<Race>(`/races/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!race) return <div className="text-center py-16" style={{ color: 'var(--dragon)' }}>Race not found.</div>;

  const asis = Object.entries(race.ability_score_increases ?? {}).filter(([, v]) => v > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/races')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Races
      </button>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid var(--teal)' }}>
            <Users className="w-7 h-7" style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-bold">{race.name}</h1>
            <div className="flex gap-2 flex-wrap mt-2">
              <span className="badge-level">{race.size} size</span>
              <span className="badge-level">{race.speed} ft speed</span>
              <span className="badge-level">{race.source}{race.page ? ` p.${race.page}` : ''}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {asis.length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-3">Ability Score Increases</h2>
                <div className="flex gap-3 flex-wrap">
                  {asis.map(([k, v]) => (
                    <div key={k} className="px-4 py-2 rounded-xl text-center" style={{ background: 'var(--surface-raised)', border: '1px solid var(--teal)' }}>
                      <p className="text-xs font-ui uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{k}</p>
                      <p className="font-heading font-bold text-lg" style={{ color: 'var(--teal2)' }}>+{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {race.traits?.length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-3">Racial Traits</h2>
                <div className="space-y-4">
                  {race.traits.map((trait) => (
                    <div key={trait.name}>
                      <h3 className="font-ui font-semibold mb-1" style={{ color: 'var(--teal2)' }}>{trait.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{trait.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {race.subraces?.length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-3">Subraces</h2>
                <div className="space-y-4">
                  {race.subraces.map((sr: Subrace) => (
                    <div key={sr.name} className="p-4 rounded-xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <h3 className="font-heading font-semibold mb-1">{sr.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{sr.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {race.languages?.length > 0 && (
              <div className="card">
                <h2 className="font-heading font-semibold mb-3">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {race.languages.map((lang) => (
                    <span key={lang} className="badge-level">{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

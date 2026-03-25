import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Sword, Plus, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface CharacterSummary { id: string; name: string; race_name: string; total_level: number; classes: { class_name: string; level: number }[] }

export function CharactersPage() {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const { data: characters, isLoading } = useQuery({
        queryKey: ['characters'],
        queryFn: () => api.get<CharacterSummary[]>('/characters'),
        enabled: !!user,
    });

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Sign in to manage characters.</p>
                <Link to="/login" className="btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Sword className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Characters</h1>
                <div className="ml-auto">
                    <Link to="/characters/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Character</Link>
                </div>
            </div>
            
            {isLoading ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading characters...</div>
            ) : characters && characters.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map(char => (
                       <div key={char.id} onClick={() => navigate(`/characters/${char.id}`)} className="card cursor-pointer hover:shadow-md transition-shadow">
                           <div className="flex items-center gap-4 mb-4">
                               <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
                                   <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                               </div>
                               <div>
                                   <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{char.name}</h2>
                                   <p className="text-sm font-ui" style={{ color: 'var(--text-secondary)' }}>Level {char.total_level} {char.race_name}</p>
                               </div>
                           </div>
                           <div className="flex flex-wrap gap-2">
                               {char.classes?.map((c, i) => (
                                   <span key={i} className="badge bg-[var(--accent-muted)] border border-[var(--border)]" style={{ color: 'var(--accent)' }}>
                                       {c.class_name} {c.level}
                                   </span>
                               ))}
                           </div>
                       </div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 card"
                >
                    <Sword className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No characters yet. Create your first!</p>
                </motion.div>
            )}
        </div>
    );
}


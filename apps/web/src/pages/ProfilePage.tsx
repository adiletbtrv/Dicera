import { useAuthStore } from '@/store/auth.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, BookOpen, Wand2, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProfilePage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const { data: chars } = useQuery({ queryKey: ['characters'], queryFn: () => api.get<any[]>('/characters') });
    const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.get<any[]>('/campaigns') });
    const { data: homebrew } = useQuery({ queryKey: ['homebrew', 'mine'], queryFn: () => api.get<{ data: any[] }>('/homebrew', { mine: 'true' }) });

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const statCards = [
        { label: 'Characters', count: chars?.length ?? 0, icon: Shield, color: 'var(--accent)', link: '/characters' },
        { label: 'Campaigns', count: campaigns?.length ?? 0, icon: BookOpen, color: 'var(--dragon)', link: '/campaigns' },
        { label: 'Homebrew', count: homebrew?.data?.length ?? 0, icon: Wand2, color: 'var(--success)', link: '/homebrew' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Profile Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col md:flex-row items-center gap-6 relative overflow-hidden p-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--dragon)]" />

                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--border-strong)]" style={{ background: 'var(--surface-raised)' }}>
                    <span className="text-4xl font-heading font-black" style={{ color: 'var(--text-primary)' }}>
                        {user.username.charAt(0).toUpperCase()}
                    </span>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{user.username}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-ui" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                        <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> Account ID: {user.id.split('-')[0]}</span>
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Link to={stat.link} className="card flex items-center gap-4 hover:border-[var(--border)] transition-colors group cursor-pointer h-full">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${stat.color}15`, color: stat.color }}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Total {stat.label}</p>
                                <p className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.count}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Quick Action / Onboarding banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card bg-[var(--surface-raised)] border-l-4" style={{ borderLeftColor: 'var(--accent)' }}>
                <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Ready for your next adventure?</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create a new character, start building a campaign, or draft some custom homebrew rules to shape your world.</p>
                <div className="flex flex-wrap gap-3">
                    <Link to="/characters/new" className="btn-primary text-sm py-1.5">New Character</Link>
                    <Link to="/campaigns/new" className="btn-secondary text-sm py-1.5">New Campaign</Link>
                </div>
            </motion.div>
        </div>
    );
}
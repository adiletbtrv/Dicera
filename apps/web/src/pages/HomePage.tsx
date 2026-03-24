import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.js';
import { Sparkles, Skull, Shield, Scroll, Swords, Dice5, Map as MapIcon, Wand2, Bot } from 'lucide-react';

const features = [
  { to: '/spells', icon: Sparkles, title: 'Spell Compendium', desc: 'Browse, filter, and search all 5e spells by class, level, school, and more.' },
  { to: '/bestiary', icon: Skull, title: 'Bestiary', desc: 'Full stat blocks for every monster. Filter by CR, type, size, and environment.' },
  { to: '/characters', icon: Shield, title: 'Character Builder', desc: 'Build and manage characters with full class, race, background, and spell support.' },
  { to: '/campaigns', icon: Scroll, title: 'Campaign Manager', desc: 'Organize sessions, NPCs, locations, and story notes for your campaign.' },
  { to: '/encounters', icon: Swords, title: 'Encounter Builder', desc: 'Build balanced encounters with XP budgeting and difficulty calculations.' },
  { to: '/dice', icon: Dice5, title: 'Dice Roller', desc: 'Roll any dice expression with history tracking and campaign integration.' },
  { to: '/maps', icon: MapIcon, title: 'Map Tools', desc: 'Upload maps, place tokens, manage fog of war, and annotate locations.' },
  { to: '/homebrew', icon: Wand2, title: 'Homebrew Workshop', desc: 'Create and share custom spells, monsters, items, classes, and more.' },
  { to: '/ai', icon: Bot, title: 'AI Assistants', desc: 'Rules Q&A, NPC dialogue, story generation, and DM advice powered by AI.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } },
};

export function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center py-12"
      >
        <div
          className="inline-flex items-center justify-center p-3.5 mb-6 rounded-2xl"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
        >
          <Shield className="w-10 h-10" style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Welcome to <span style={{ color: 'var(--dragon)' }}>Dicera</span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto font-body font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your all-in-one Dungeons & Dragons 5th Edition toolkit. Build characters, manage campaigns,
          explore spells and monsters, and get AI-powered DM assistance.
        </p>

        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-10 flex gap-4 justify-center"
          >
            <Link to="/register" className="btn-primary text-base px-8 py-3 rounded-xl">
              Get Started Free
            </Link>
            <Link to="/spells" className="btn-secondary text-base px-8 py-3 rounded-xl">
              Browse Spells
            </Link>
          </motion.div>
        )}

        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Welcome back, <span className="font-semibold" style={{ color: 'var(--accent)' }}>{user.display_name ?? user.username}</span>!
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link to="/characters/new" className="btn-primary">Create Character</Link>
              <Link to="/campaigns" className="btn-secondary">My Campaigns</Link>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {features.map((feature) => (
          <motion.div key={feature.to} variants={itemVariants}>
            <Link
              to={feature.to}
              className="card group flex flex-col h-full"
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: 'var(--accent-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <feature.icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h2>
                  <p className="text-sm mt-2 leading-relaxed font-body" style={{ color: 'var(--text-secondary)' }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 card"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="font-heading text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--dragon)' }}>
          <Shield className="w-5 h-5" /> Content License Notice
        </h2>
        <p className="text-sm leading-relaxed font-body" style={{ color: 'var(--text-secondary)' }}>
          Dungeons & Dragons content (spells, monsters, rules) is © Wizards of the Coast.
          This platform uses publicly available SRD content and data sources under the{' '}
          <a href="https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf"
            className="font-medium transition-colors hover:underline" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">
            Creative Commons Attribution 4.0 International License
          </a>.
          Non-SRD content requires appropriate licensing.
        </p>
      </motion.div>
    </div>
  );
}

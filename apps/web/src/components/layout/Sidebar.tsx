import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils.js';
import {
  Home, Sparkles, Sword, Scroll, Dice5, Map as MapIcon, Wand2, Bot, Skull, Swords,
  Users, GraduationCap, BookOpen, Shield, Package, Star, BookOpenCheck,
  ChevronDown, Wrench, Trophy, User,
} from 'lucide-react';

interface NavSection {
  label: string;
  items: { to: string; label: string; icon: React.ElementType; exact?: boolean }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Home', icon: Home, exact: true },
    ],
  },
  {
    label: 'Compendium',
    items: [
      { to: '/spells', label: 'Spells', icon: Sparkles },
      { to: '/bestiary', label: 'Bestiary', icon: Skull },
      { to: '/races', label: 'Races', icon: Users },
      { to: '/classes', label: 'Classes', icon: GraduationCap },
      { to: '/backgrounds', label: 'Backgrounds', icon: BookOpen },
      { to: '/feats', label: 'Feats', icon: Star },
      { to: '/conditions', label: 'Conditions', icon: Shield },
      { to: '/equipment', label: 'Equipment', icon: Package },
      { to: '/magic-items', label: 'Magic Items', icon: Sparkles },
      { to: '/rules', label: 'Rules Reference', icon: BookOpenCheck },
    ],
  },
  {
    label: 'Play',
    items: [
      { to: '/characters', label: 'Characters', icon: Sword },
      { to: '/campaigns', label: 'Campaigns', icon: Scroll },
      { to: '/encounters', label: 'Encounters', icon: Swords },
      { to: '/maps', label: 'Maps', icon: MapIcon },
      { to: '/dice', label: 'Dice Roller', icon: Dice5 },
    ],
  },
  {
    label: 'DM Tools',
    items: [
      { to: '/tools/initiative', label: 'Initiative', icon: Swords },
      { to: '/tools/spell-slots', label: 'Spell Slots', icon: Sparkles },
      { to: '/tools/cr-budget', label: 'CR Budget', icon: Trophy },
      { to: '/tools/loot', label: 'Loot Generator', icon: Package },
      { to: '/tools/names', label: 'Name Generator', icon: User },
    ],
  },
  {
    label: 'Create',
    items: [
      { to: '/homebrew', label: 'Homebrew', icon: Wand2 },
      { to: '/ai', label: 'AI Assistant', icon: Bot },
    ],
  },
];

function SidebarSection({ section, defaultOpen = true }: { section: NavSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const hasActive = section.items.some((item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-lg transition-colors"
        style={{ color: hasActive ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        <span className="text-xs font-ui font-semibold uppercase tracking-wider">{section.label}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={!!item.exact}
                    className={cn('relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-ui font-medium transition-all duration-200 z-10')}
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'var(--sidebar-active)' }}
                        initial={false}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className="w-[16px] h-[16px] relative z-10 transition-colors flex-shrink-0"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                    />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside
      className="w-64 h-full flex-shrink-0 flex flex-col relative z-20 transition-colors duration-300"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <div className="p-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-arcane-500 to-arcane-700 shadow-lg">
            <Sword className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dicera</span>
            <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>5th Edition Toolkit</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {NAV_SECTIONS.map((section, i) => (
          <SidebarSection key={section.label} section={section} defaultOpen={i < 2} />
        ))}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Dicera v1.1.0</p>
        </div>
      </div>
    </aside>
  );
}

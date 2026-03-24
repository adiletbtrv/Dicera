import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils.js';
import {
  Home,
  Sparkles,
  Sword,
  Scroll,
  Dice5,
  Map as MapIcon,
  Wand2,
  Bot,
  Skull,
  Swords,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/spells', label: 'Spells', icon: Sparkles },
  { to: '/bestiary', label: 'Bestiary', icon: Skull },
  { to: '/characters', label: 'Characters', icon: Sword },
  { to: '/campaigns', label: 'Campaigns', icon: Scroll },
  { to: '/encounters', label: 'Encounters', icon: Swords },
  { to: '/dice', label: 'Dice Roller', icon: Dice5 },
  { to: '/maps', label: 'Maps', icon: MapIcon },
  { to: '/homebrew', label: 'Homebrew', icon: Wand2 },
  { to: '/ai', label: 'AI Assistant', icon: Bot },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="w-64 h-full flex-shrink-0 flex flex-col relative z-20 transition-colors duration-300"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >

      <div className="p-6" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-arcane-500 to-arcane-700 shadow-lg">
            <Sword className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Dicera
            </span>
            <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>
              5th Edition Toolkit
            </p>
          </div>
        </div>
      </div>


      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={!!item.exact}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-ui font-medium transition-all duration-200 z-10',
              )}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              }}
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
                className={cn('w-[18px] h-[18px] relative z-10 transition-colors')}
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>


      <div className="p-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>
            DnD OS v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.js';
import { useThemeStore } from '@/store/theme.js';
import { Sun, Moon, LogOut, LogIn, UserPlus, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center px-4 md:px-6 backdrop-blur-xl transition-colors duration-300"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <button 
        className="md:hidden btn-ghost p-2 rounded-xl mr-2" 
        onClick={onMenuClick}
        title="Open Navigation"
      >
        <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">

        <button
          onClick={toggle}
          className="btn-ghost p-2 rounded-xl"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {user ? (
          <>
            <span className="text-sm font-ui font-medium" style={{ color: 'var(--text-secondary)' }}>
              {user.display_name ?? user.username}
            </span>
            <button
              onClick={handleLogout}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { Sun, Moon, LogOut, LogIn, UserPlus, Menu, Search } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header
      className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl transition-colors duration-300 gap-4 sticky top-0 z-40 w-full shadow-sm"
      style={{
        background: 'var(--header-bg, var(--bg))',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left Side: Mobile Menu & Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button
          className="lg:hidden btn-ghost p-2 rounded-xl -ml-2"
          onClick={onMenuClick}
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <button
          onClick={onSearchClick}
          className="btn-ghost px-3 py-2 rounded-xl hidden lg:flex items-center gap-2 text-sm w-full max-w-[400px] justify-between group"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          aria-label="Open search (Cmd+K)"
        >
          <div className="flex items-center gap-2 group-hover:text-[var(--text-primary)] transition-colors">
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">Search items, spells, monsters...</span>
          </div>
          <kbd className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ⌘K
          </kbd>
        </button>

        <button onClick={onSearchClick} className="lg:hidden btn-ghost p-2 rounded-xl">
          <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Right Side: Theme & Profile/Auth */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button
          onClick={toggle}
          className="btn-ghost p-2 rounded-xl"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />

        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:bg-[var(--surface-raised)] px-2 sm:px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-[var(--border-strong)] active:scale-95 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm shadow-inner" style={{ background: 'var(--accent)', color: 'white' }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:block tracking-wide hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                {user.display_name ?? user.username}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium">
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </Link>
            <Link to="/register" className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold shadow-md">
              <UserPlus className="w-3.5 h-3.5" /> Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
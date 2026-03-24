import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
}

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('dnd-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('dnd-theme', theme);
}

export const useThemeStore = create<ThemeState>((set) => {
    const initial = getInitialTheme();
    applyTheme(initial);

    return {
        theme: initial,
        toggle: () =>
            set((state) => {
                const next = state.theme === 'dark' ? 'light' : 'dark';
                applyTheme(next);
                return { theme: next };
            }),
        setTheme: (theme: Theme) => {
            applyTheme(theme);
            set({ theme });
        },
    };
});

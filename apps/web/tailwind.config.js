/** @type {import('tailwindcss').Config} */
const config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                surface: {
                    DEFAULT: 'var(--surface)',
                    raised: 'var(--surface-raised)',
                    overlay: 'var(--surface-overlay)',
                },
                border: {
                    DEFAULT: 'var(--border)',
                    subtle: 'var(--border-subtle)',
                },
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                    muted: 'var(--accent-muted)',
                },
                parchment: {
                    50: '#fdf9f0', 100: '#faf0d7', 200: '#f5e0ae', 300: '#eecb7f',
                    400: '#e5b04e', 500: '#dc9828', 600: '#c47e1e', 700: '#a36318',
                    800: '#844e1a', 900: '#6c4118',
                },
                dragon: {
                    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
                    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
                    800: '#991b1b', 900: '#7f1d1d',
                },
                arcane: {
                    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
                    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
                    800: '#5b21b6', 900: '#4c1d95',
                },
            },
            fontFamily: {
                heading: ['Montserrat', 'system-ui', 'sans-serif'],
                body: ['Roboto', 'system-ui', 'sans-serif'],
                ui: ['Rubik', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
                serif: ['Montserrat', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.25rem',
            },
            backgroundImage: {
                'parchment-texture': "url('/textures/parchment.webp')",
            },
            transitionTimingFunction: {
                'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            },
        },
    },
    plugins: [],
};
export default config;

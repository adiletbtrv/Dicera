import { create } from 'zustand';
import { api } from '@/lib/api.js';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token } = await api.post<{ token: string; userId: string }>('/auth/login', {
        email,
        password,
      });
      api.setToken(token);
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      const { token } = await api.post<{ token: string; userId: string }>('/auth/register', {
        email,
        username,
        password,
      });
      api.setToken(token);
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.setToken(null);
    set({ user: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, isLoading: false });
    }
  },
}));

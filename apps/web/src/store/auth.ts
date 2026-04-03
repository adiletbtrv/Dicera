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
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/login', { email, password });
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
      await api.post('/auth/register', { email, username, password });
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    set({ user: null });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));

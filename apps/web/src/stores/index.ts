import { create } from 'zustand';
import type { User } from '@agency/shared';
import api from '../lib/api';
import { clearAccessToken, setAccessToken } from '../lib/token';
import { disconnectSocket } from '../lib/socket';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  bootstrapCompleted: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  completeBootstrap: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  bootstrapCompleted: false,
  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true });
  },
  clearAuth: () => {
    clearAccessToken();
    set({ user: null, isAuthenticated: false });
  },
  completeBootstrap: () => set({ bootstrapCompleted: true }),
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The refresh token will expire on the server; ignore client-side errors.
    }
    clearAccessToken();
    disconnectSocket();
    queryClient.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  notificationDropdownOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotificationDropdown: () => void;
  setNotificationDropdownOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  notificationDropdownOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleNotificationDropdown: () => set((state) => ({ notificationDropdownOpen: !state.notificationDropdownOpen })),
  setNotificationDropdownOpen: (notificationDropdownOpen) => set({ notificationDropdownOpen }),
}));
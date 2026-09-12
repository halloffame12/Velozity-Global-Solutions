import { useEffect } from 'react';
import api, { refreshAccessToken } from '../lib/api';
import { useAuthStore } from '../stores';

export function useAuthBootstrap() {
  const { setAuth, clearAuth, completeBootstrap, bootstrapCompleted, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = await refreshAccessToken();
      if (cancelled) return;

      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (!cancelled) {
            setAuth(response.data.data.user, token);
          }
        } catch {
          if (!cancelled) clearAuth();
        }
      } else if (!cancelled) {
        clearAuth();
      }

      if (!cancelled) completeBootstrap();
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth, completeBootstrap]);

  return { isAuthenticated, bootstrapCompleted };
}
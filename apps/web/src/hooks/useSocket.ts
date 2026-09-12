import { useEffect } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../stores';
import { getAccessToken } from '../lib/token';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = getAccessToken();
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return getSocket();
}
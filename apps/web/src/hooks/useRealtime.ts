import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';

const QUERY_GROUPS: Record<string, string[]> = {
  'task:updated': ['tasks', 'project', 'projects', 'dashboard'],
  'activity:new': ['activity', 'dashboard'],
  'notification:new': ['notifications'],
  'presence:update': ['dashboard'],
};

export function useRealtime() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handlers: Array<[string, () => void]> = Object.entries(QUERY_GROUPS).map(
      ([event, keys]) => [
        event,
        () => {
          keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
        },
      ]
    );

    handlers.forEach(([event, handler]) => socket.on(event, handler));
    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, queryClient]);
}
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export function useProjectRoom(projectId?: string) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    const join = () => {
      socket.emit('join-project', { projectId });
    };
    const leave = () => {
      socket.emit('leave-project', { projectId });
    };

    join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
      leave();
    };
  }, [socket, projectId]);
}
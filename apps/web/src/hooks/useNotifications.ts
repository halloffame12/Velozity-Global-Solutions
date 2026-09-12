import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores';
import { fetchNotifications } from '../lib/apiEndpoints';
import api from '../lib/api';
import { useSocket } from './useSocket';

export function useNotifications() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
  });

  useEffect(() => {
    if (!socket || !user) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', invalidate);

    return () => {
      socket.off('notification:new', invalidate);
    };
  }, [socket, user, queryClient]);

  const markAsRead = async (notificationId: string) => {
    await api.put(`/notifications/${notificationId}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllAsRead = async () => {
    await api.put('/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    notifications: data?.data?.notifications || [],
    unreadCount: data?.data?.unreadCount || 0,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
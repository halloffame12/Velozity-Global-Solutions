import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { emitNotificationToUser } from '../sockets';
import type { Notification } from '@prisma/client';

export async function getNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, unreadCount };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    throw new AppError(404, 'NOT_FOUND', 'Notification not found');
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export type CreateNotificationInput = Pick<Notification, 'userId' | 'type' | 'title' | 'message'> & {
  taskId?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const notification = await prisma.notification.create({ data: input });
  await emitNotificationToUser(input.userId, notification);
  return notification;
}
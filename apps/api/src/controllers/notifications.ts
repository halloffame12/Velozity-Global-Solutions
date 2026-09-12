import { asyncHandler } from '../lib/errors';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notifications';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotificationsHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = await getNotifications(req.user!.userId);
  res.status(200).json({ success: true, data });
});

export const markReadHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await markNotificationAsRead(req.params.notificationId, req.user!.userId);
  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

export const markAllReadHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await markAllNotificationsAsRead(req.user!.userId);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
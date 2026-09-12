import { asyncHandler } from '../lib/errors';
import { getOnlineUsers, getOnlineUserCount } from '../sockets';
import { AuthenticatedRequest } from '../middleware/auth';

export const getOnlineUsersHandler = asyncHandler(async (_req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    data: {
      onlineUsers: getOnlineUsers(),
      count: getOnlineUserCount(),
    },
  });
});
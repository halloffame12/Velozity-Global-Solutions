import { asyncHandler } from '../lib/errors';
import { getDashboardData } from '../services/dashboard';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = await getDashboardData({ userId: req.user!.userId, role: req.user!.role });
  res.status(200).json({
    success: true,
    data,
  });
});
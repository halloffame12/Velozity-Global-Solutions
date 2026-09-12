import { asyncHandler, forbiddenError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { ROLES } from '../config/constants';
import { getDeveloperTaskIds, getManagerProjectIds } from '../services/access';
import { AuthenticatedRequest } from '../middleware/auth';

const activityInclude = {
  user: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, assignedDeveloperId: true } },
};

async function activityWhere(req: AuthenticatedRequest, projectId?: string): Promise<object> {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const where: Record<string, unknown> = {};

  if (projectId) {
    where.projectId = projectId;
    if (role === ROLES.PROJECT_MANAGER) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true },
      });
      if (!project || project.createdById !== userId) {
        throw forbiddenError('You do not have permission to view this activity');
      }
    }
    if (role === ROLES.DEVELOPER) {
      const taskIds = await getDeveloperTaskIds(userId);
      where.taskId = { in: taskIds };
    }
    return where;
  }

  if (role === ROLES.PROJECT_MANAGER) {
    const projectIds = await getManagerProjectIds(userId);
    where.projectId = { in: projectIds };
  } else if (role === ROLES.DEVELOPER) {
    const taskIds = await getDeveloperTaskIds(userId);
    where.taskId = { in: taskIds };
  }
  return where;
}

export const getActivityLogs = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { projectId, limit } = req.query as { projectId?: string; limit?: string };
  const where = await activityWhere(req, projectId);
  const logs = await prisma.activityLog.findMany({
    where,
    include: activityInclude,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 20, 100),
  });
  res.status(200).json({
    success: true,
    data: { logs },
  });
});

export const getRecentActivity = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const where = await activityWhere(req);
  const logs = await prisma.activityLog.findMany({
    where,
    include: activityInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.status(200).json({
    success: true,
    data: { logs },
  });
});
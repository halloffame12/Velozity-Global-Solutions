import { prisma } from '../lib/prisma';
import { ROLES, TASK_STATUS } from '../config/constants';
import { getOnlineUsers, getOnlineUserCount } from '../sockets';
import type { Role } from '../config/constants';

export async function markOverdueTasks(): Promise<number> {
  const now = new Date();

  const newlyOverdue = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: TASK_STATUS.DONE },
      isOverdue: false,
    },
    select: { id: true },
  });

  for (const task of newlyOverdue) {
    await prisma.task.update({
      where: { id: task.id },
      data: { isOverdue: true },
    });
  }

  // A task whose due date moved to the future, or that was completed some
  // other way, should not stay flagged as overdue forever.
  const noLongerOverdue = await prisma.task.findMany({
    where: {
      isOverdue: true,
      OR: [
        { status: TASK_STATUS.DONE },
        { dueDate: { gte: now } },
        { dueDate: null },
      ],
    },
    select: { id: true },
  });

  for (const task of noLongerOverdue) {
    await prisma.task.update({
      where: { id: task.id },
      data: { isOverdue: false },
    });
  }

  return newlyOverdue.length;
}

interface DashboardUser {
  userId: string;
  role: Role;
}

function statusBreakdown(tasks: { status: string }[]) {
  return {
    todo: tasks.filter(t => t.status === TASK_STATUS.TODO).length,
    inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
    inReview: tasks.filter(t => t.status === TASK_STATUS.IN_REVIEW).length,
    done: tasks.filter(t => t.status === TASK_STATUS.DONE).length,
  };
}

function priorityBreakdown(tasks: { priority: string }[]) {
  return {
    low: tasks.filter(t => t.priority === 'LOW').length,
    medium: tasks.filter(t => t.priority === 'MEDIUM').length,
    high: tasks.filter(t => t.priority === 'HIGH').length,
    critical: tasks.filter(t => t.priority === 'CRITICAL').length,
  };
}

function overdueCount(tasks: { dueDate: Date | null; status: string }[], now: Date): number {
  return tasks.filter(
    t => t.dueDate && t.dueDate < now && t.status !== TASK_STATUS.DONE,
  ).length;
}

const activityInclude = {
  user: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, assignedDeveloperId: true } },
};

export async function getDashboardData(user: DashboardUser) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (user.role === ROLES.ADMIN) {
    const [totalProjects, totalTasks, recentActivity] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.activityLog.findMany({
        where: {},
        include: activityInclude,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const tasks = await prisma.task.findMany({
      select: { id: true, status: true, priority: true, dueDate: true },
    });

    return {
      totalProjects,
      totalTasks,
      overdueCount: overdueCount(tasks as any[], now),
      taskStats: statusBreakdown(tasks),
      priorityStats: priorityBreakdown(tasks),
      recentActivity,
      onlineUsers: getOnlineUsers(),
      onlineUsersCount: getOnlineUserCount(),
    };
  }

  if (user.role === ROLES.PROJECT_MANAGER) {
    const ownedProjects = await prisma.project.findMany({
      where: { createdById: user.userId },
      select: { id: true },
    });
    const projectIds = ownedProjects.map(p => p.id);

    const [tasks, recentActivity] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true, status: true, priority: true, dueDate: true },
      }),
      prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        include: activityInclude,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const upcomingDueTasks = tasks
      .filter(t => t.dueDate && t.dueDate >= now && t.dueDate <= weekFromNow && t.status !== TASK_STATUS.DONE)
      .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()));

    return {
      totalProjects: projectIds.length,
      totalTasks: tasks.length,
      overdueCount: overdueCount(tasks as any[], now),
      taskStats: statusBreakdown(tasks),
      priorityStats: priorityBreakdown(tasks),
      recentActivity,
      upcomingDueTasks,
    };
  }

  // Developer
  const tasks = await prisma.task.findMany({
    where: { assignedDeveloperId: user.userId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      isOverdue: true,
      projectId: true,
      assignedDeveloperId: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  const assignedTaskIds = tasks.map(t => t.id);
  const recentActivity = await prisma.activityLog.findMany({
    where: assignedTaskIds.length > 0 ? { taskId: { in: assignedTaskIds } } : undefined,
    include: activityInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    tasks,
    totalTasks: tasks.length,
    overdueCount: overdueCount(tasks as any[], now),
    taskStats: statusBreakdown(tasks),
    priorityStats: priorityBreakdown(tasks),
    recentActivity,
  };
}
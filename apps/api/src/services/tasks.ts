import { prisma } from '../lib/prisma';
import { ROLES, TASK_STATUS } from '../config/constants';
import { AppError, badRequestError, forbiddenError, notFoundError } from '../lib/errors';
import { emitTaskUpdated, emitActivityCreated } from '../sockets';
import { createNotification } from './notifications';
import { getManagerProjectIds } from './access';
import type { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import type { Role } from '../config/constants';

const taskInclude = {
  project: {
    include: {
      client: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  },
  assignedDeveloper: { select: { id: true, name: true, email: true } },
};

const activityInclude = {
  user: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, assignedDeveloperId: true } },
};

interface Actor {
  userId: string;
  role: Role;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assignedDeveloperId: string;
  priority: TaskPriority;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedDeveloperId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueFrom?: Date;
  dueTo?: Date;
  projectId?: string;
  limit?: number;
}

function emptyTaskStats() {
  return { total: 0, todo: 0, inProgress: 0, inReview: 0, done: 0, low: 0, medium: 0, high: 0, critical: 0 };
}

export async function createTask(actor: Actor, input: CreateTaskInput) {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { client: true },
  });
  if (!project) {
    throw new AppError(400, 'BAD_REQUEST', 'Project not found');
  }
  if (actor.role === ROLES.PROJECT_MANAGER && project.createdById !== actor.userId) {
    throw forbiddenError('You do not have permission to create tasks in this project');
  }

  const developer = await prisma.user.findUnique({
    where: { id: input.assignedDeveloperId },
  });
  if (!developer || developer.role !== ROLES.DEVELOPER) {
    throw badRequestError('Assigned user is not a developer');
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      assignedDeveloperId: input.assignedDeveloperId,
      priority: input.priority,
      dueDate: input.dueDate,
      status: TASK_STATUS.TODO,
    },
    include: taskInclude,
  });

  const activity = await prisma.activityLog.create({
    data: {
      projectId: task.projectId,
      taskId: task.id,
      userId: actor.userId,
      action: 'TASK_CREATED',
      newStatus: task.status,
    },
    include: activityInclude,
  });

  await createNotification({
    userId: task.assignedDeveloperId!,
    type: 'TASK_ASSIGNED',
    title: 'New task assigned',
    message: `You have been assigned "${task.title}" in project "${project.name}"`,
    taskId: task.id,
  });

  await Promise.all([emitTaskUpdated(task), emitActivityCreated(activity)]);

  return task;
}

export async function listTasks(actor: Actor, filters: TaskFilters) {
  const where: Prisma.TaskWhereInput = {};
  let denyAccess = false;

  if (actor.role === ROLES.ADMIN) {
    if (filters.projectId) where.projectId = filters.projectId;
  } else if (actor.role === ROLES.PROJECT_MANAGER) {
    const projectIds = await getManagerProjectIds(actor.userId);
    if (filters.projectId && !projectIds.includes(filters.projectId)) {
      denyAccess = true;
    } else {
      where.projectId = { in: projectIds };
    }
  } else {
    where.assignedDeveloperId = actor.userId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.dueFrom || filters.dueTo) {
    const due: Prisma.DateTimeNullableFilter = {};
    if (filters.dueFrom) due.gte = filters.dueFrom;
    if (filters.dueTo) due.lte = filters.dueTo;
    where.dueDate = due;
  }

  if (denyAccess) {
    return { tasks: [], stats: emptyTaskStats() };
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    actor.role === ROLES.DEVELOPER
      ? [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
      : [{ createdAt: 'desc' }];

  const [tasks, statusGroups, priorityGroups] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy, take: filters.limit }),
    prisma.task.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where, _count: { _all: true } }),
  ]);

  const statusKeyMap: Record<TaskStatus, string> = {
    TODO: 'todo',
    IN_PROGRESS: 'inProgress',
    IN_REVIEW: 'inReview',
    DONE: 'done',
  };

  const stats = emptyTaskStats();
  for (const g of statusGroups) {
    const key = statusKeyMap[g.status];
    stats[key as keyof typeof stats] = g._count._all;
    stats.total += g._count._all;
  }
  for (const g of priorityGroups) {
    stats[g.priority.toLowerCase() as keyof typeof stats] = g._count._all;
  }

  return { tasks, stats };
}

export async function getTask(actor: Actor, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      ...taskInclude,
      activityLogs: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!task) {
    throw notFoundError('Task');
  }
  if (actor.role === ROLES.DEVELOPER && task.assignedDeveloperId !== actor.userId) {
    throw forbiddenError('You do not have permission to access this task');
  }
  if (actor.role === ROLES.PROJECT_MANAGER) {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { createdById: true },
    });
    if (!project || project.createdById !== actor.userId) {
      throw forbiddenError('You do not have permission to access this task');
    }
  }
  return task;
}

export async function updateTask(actor: Actor, taskId: string, data: UpdateTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw notFoundError('Task');
  }

  if (actor.role === ROLES.DEVELOPER) {
    if (task.assignedDeveloperId !== actor.userId) {
      throw forbiddenError('You do not have permission to update this task');
    }
    if (Object.keys(data).some(key => key !== 'status')) {
      throw badRequestError('Developers can only update the task status');
    }
  } else if (actor.role === ROLES.PROJECT_MANAGER) {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { createdById: true },
    });
    if (!project || project.createdById !== actor.userId) {
      throw forbiddenError('You do not have permission to update this task');
    }
  }

  if (data.assignedDeveloperId) {
    const developer = await prisma.user.findUnique({
      where: { id: data.assignedDeveloperId },
    });
    if (!developer || developer.role !== ROLES.DEVELOPER) {
      throw badRequestError('Assigned user is not a developer');
    }
  }

  const now = new Date();
  const updateData: Prisma.TaskUncheckedUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assignedDeveloperId !== undefined) updateData.assignedDeveloperId = data.assignedDeveloperId;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.status !== undefined) updateData.status = data.status;

  if (data.status === TASK_STATUS.DONE) {
    updateData.isOverdue = false;
  } else if (data.dueDate && data.dueDate < now) {
    updateData.isOverdue = true;
  }

  const statusChanged = data.status !== undefined && data.status !== task.status;

  const { updatedTask, activity } = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: updateData,
      include: taskInclude,
    });

    let activity = null;
    if (statusChanged) {
      activity = await tx.activityLog.create({
        data: {
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
          userId: actor.userId,
          action: 'TASK_STATUS_CHANGED',
          previousStatus: task.status,
          newStatus: updatedTask.status,
        },
        include: activityInclude,
      });
    }
    return { updatedTask, activity };
  });

  // A developer moving a task into review is the signal that a project
  // manager needs to look at it.
  const movedToReview =
    statusChanged &&
    data.status === TASK_STATUS.IN_REVIEW &&
    updatedTask.project.createdBy.id !== actor.userId;

  if (movedToReview) {
    await createNotification({
      userId: updatedTask.project.createdBy.id,
      type: 'TASK_MOVED_TO_REVIEW',
      title: 'Task ready for review',
      message: `"${updatedTask.title}" in project "${updatedTask.project.name}" was moved to In Review`,
      taskId: updatedTask.id,
    });
  }

  const emissions: Promise<void>[] = [emitTaskUpdated(updatedTask)];
  if (activity) {
    emissions.push(emitActivityCreated(activity));
  }
  await Promise.all(emissions);

  return updatedTask;
}
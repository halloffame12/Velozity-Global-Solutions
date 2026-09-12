import { prisma } from '../lib/prisma';
import { ROLES, TASK_STATUS } from '../config/constants';
import { AppError, forbiddenError, notFoundError } from '../lib/errors';
import { emitActivityCreated, invalidateProjectOwner } from '../sockets';
import type { Role } from '../config/constants';

interface Actor {
  userId: string;
  role: Role;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  clientId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  clientId?: string;
}

const projectInclude = {
  client: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true } },
};

const activityInclude = {
  user: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, assignedDeveloperId: true } },
};

export async function createProject(actor: Actor, input: CreateProjectInput) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) {
    throw new AppError(400, 'BAD_REQUEST', 'Client not found');
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId,
      createdById: actor.userId,
    },
    include: projectInclude,
  });

  const activity = await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: actor.userId,
      action: 'PROJECT_CREATED',
    },
    include: activityInclude,
  });
  await emitActivityCreated(activity);

  return project;
}

export async function listProjects(actor: Actor) {
  if (actor.role === ROLES.ADMIN) {
    return prisma.project.findMany({
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
  if (actor.role === ROLES.PROJECT_MANAGER) {
    return prisma.project.findMany({
      where: { createdById: actor.userId },
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
  // Developers only see projects where they actually have assigned work.
  return prisma.project.findMany({
    where: { tasks: { some: { assignedDeveloperId: actor.userId } } },
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProject(actor: Actor, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ...projectInclude,
      tasks: {
        include: {
          assignedDeveloper: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!project) {
    throw notFoundError('Project');
  }
  if (actor.role === ROLES.DEVELOPER) {
    const hasWork = await prisma.task.count({
      where: { projectId, assignedDeveloperId: actor.userId },
    });
    if (hasWork === 0) {
      throw forbiddenError('You do not have permission to access this project');
    }
  } else if (actor.role === ROLES.PROJECT_MANAGER && project.createdById !== actor.userId) {
    throw forbiddenError('You do not have permission to access this project');
  }

  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter(t => t.status === TASK_STATUS.TODO).length,
    inProgress: project.tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
    inReview: project.tasks.filter(t => t.status === TASK_STATUS.IN_REVIEW).length,
    done: project.tasks.filter(t => t.status === TASK_STATUS.DONE).length,
  };

  return { project, taskStats };
}

export async function updateProject(actor: Actor, projectId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw notFoundError('Project');
  }
  if (actor.role !== ROLES.ADMIN && project.createdById !== actor.userId) {
    throw forbiddenError('You do not have permission to update this project');
  }
  if (input.clientId) {
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) {
      throw new AppError(400, 'BAD_REQUEST', 'Client not found');
    }
  }
  return prisma.project.update({
    where: { id: projectId },
    data: input,
    include: projectInclude,
  });
}

export async function deleteProject(actor: Actor, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw notFoundError('Project');
  }
  if (actor.role !== ROLES.ADMIN && project.createdById !== actor.userId) {
    throw forbiddenError('You do not have permission to delete this project');
  }
  await prisma.project.delete({ where: { id: projectId } });
  invalidateProjectOwner(projectId);
}
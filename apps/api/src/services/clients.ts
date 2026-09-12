import { prisma } from '../lib/prisma';
import { ROLES } from '../config/constants';
import { AppError, forbiddenError, notFoundError } from '../lib/errors';
import { getManagerProjectIds } from './access';
import type { Role } from '../config/constants';

interface Actor {
  userId: string;
  role: Role;
}

export interface CreateClientInput {
  name: string;
  email: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
}

const clientInclude = {
  _count: { select: { projects: true } },
  projects: {
    select: {
      id: true,
      name: true,
      createdById: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  },
};

export async function createClient(actor: Actor, input: CreateClientInput) {
  if (actor.role !== ROLES.ADMIN) {
    throw forbiddenError('Only admins can create clients');
  }
  const existing = await prisma.client.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A client with this email already exists');
  }
  return prisma.client.create({ data: input, include: clientInclude });
}

export async function listClients(actor: Actor) {
  const clients = await prisma.client.findMany({
    include: clientInclude,
    orderBy: { createdAt: 'desc' },
  });
  if (actor.role === ROLES.ADMIN) {
    return clients;
  }
  const projectIds =
    actor.role === ROLES.PROJECT_MANAGER
      ? await getManagerProjectIds(actor.userId)
      : (
          await prisma.project.findMany({
            where: { tasks: { some: { assignedDeveloperId: actor.userId } } },
            select: { id: true },
          })
        ).map(p => p.id);
  return clients.filter(c => c.projects.some(p => projectIds.includes(p.id)));
}

export async function getClient(actor: Actor, clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      ...clientInclude,
      projects: {
        select: {
          id: true,
          name: true,
          createdById: true,
          tasks: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
        },
      },
    },
  });
  if (!client) {
    throw notFoundError('Client');
  }
  if (actor.role === ROLES.ADMIN) {
    return client;
  }
  const projectIds =
    actor.role === ROLES.PROJECT_MANAGER
      ? await getManagerProjectIds(actor.userId)
      : (
          await prisma.project.findMany({
            where: { tasks: { some: { assignedDeveloperId: actor.userId } } },
            select: { id: true },
          })
        ).map(p => p.id);
  if (!client.projects.some(p => projectIds.includes(p.id))) {
    throw forbiddenError('You do not have permission to access this client');
  }
  return client;
}

export async function updateClient(actor: Actor, clientId: string, input: UpdateClientInput) {
  if (actor.role !== ROLES.ADMIN) {
    throw forbiddenError('Only admins can update clients');
  }
  const existing = await prisma.client.findUnique({ where: { id: clientId } });
  if (!existing) {
    throw notFoundError('Client');
  }
  if (input.email) {
    const duplicate = await prisma.client.findFirst({
      where: { email: input.email, id: { not: clientId } },
    });
    if (duplicate) {
      throw new AppError(409, 'CONFLICT', 'A client with this email already exists');
    }
  }
  return prisma.client.update({
    where: { id: clientId },
    data: input,
    include: clientInclude,
  });
}

export async function deleteClient(actor: Actor, clientId: string) {
  if (actor.role !== ROLES.ADMIN) {
    throw forbiddenError('Only admins can delete clients');
  }
  const existing = await prisma.client.findUnique({ where: { id: clientId } });
  if (!existing) {
    throw notFoundError('Client');
  }
  // Project/task/activity/notification rows cascade from the client FK.
  await prisma.client.delete({ where: { id: clientId } });
}
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { prisma } from '../lib/prisma';
import { JWT_SECRET, CLIENT_URL } from '../config/env';
import { ROLES, Role } from '../config/constants';

interface SocketUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

let io: SocketIOServer | null = null;

// Presence keeps the set of socket ids per user so a user closing one of
// several tabs doesn't drop them from the online set.
const connections = new Map<string, Set<string>>();
const presenceUsers = new Map<string, PresenceUser>();

// Project owners are cached in memory for the duration of a request burst;
// they only change through project.create/update which we could invalidate here.
const projectOwners = new Map<string, string>();

export function setupSocketIO(server: ReturnType<typeof createServer>): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('unauthorized'));
      }
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) {
        return next(new Error('unauthorized'));
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    socket.join(`user:${user.id}`);
    if (user.role === ROLES.ADMIN) {
      socket.join('admin');
    }

    const wasOffline = !connections.has(user.id);
    let sockets = connections.get(user.id);
    if (!sockets) {
      sockets = new Set();
      connections.set(user.id, sockets);
    }
    sockets.add(socket.id);
    presenceUsers.set(user.id, { id: user.id, name: user.name, email: user.email, role: user.role });

    if (wasOffline) {
      prisma.user
        .update({ where: { id: user.id }, data: { isOnline: true } })
        .catch(() => {});
      broadcastPresence();
    }

    socket.on('join-project', async (projectId: string) => {
      try {
        const allowed = await canViewProject(user, projectId);
        if (!allowed) {
          socket.emit('join-project-denied', { projectId });
          return;
        }
        socket.join(`project:${projectId}`);
        socket.emit('joined-project', { projectId });
      } catch {
        socket.emit('join-project-denied', { projectId });
      }
    });

    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      const remaining = removeConnection(user.id, socket.id);
      if (!remaining) {
        presenceUsers.delete(user.id);
        prisma.user
          .update({ where: { id: user.id }, data: { isOnline: false } })
          .catch(() => {});
        broadcastPresence();
      }
    });
  });

  return io;
}

function removeConnection(userId: string, socketId: string): boolean {
  const sockets = connections.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    connections.delete(userId);
    return false;
  }
  return true;
}

async function canViewProject(user: SocketUser, projectId: string): Promise<boolean> {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.PROJECT_MANAGER) {
    const ownerId = await getProjectOwner(projectId);
    return ownerId === user.id;
  }
  const hasTask = await prisma.task.count({
    where: { projectId, assignedDeveloperId: user.id },
  });
  return hasTask > 0;
}

async function getProjectOwner(projectId: string): Promise<string | null> {
  const cached = projectOwners.get(projectId);
  if (cached) return cached;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });
  if (!project) return null;
  projectOwners.set(projectId, project.createdById);
  return project.createdById;
}

// Emits an event to everyone eligible to see the project, deciding per-socket
// instead of trusting a single room for all roles:
//  - admin can see everything
//  - project managers only their own projects
//  - developers only events about tasks assigned to them
interface ProjectAudiencePayload {
  task?: { assignedDeveloperId?: string | null } | null;
  activity?: { task?: { assignedDeveloperId?: string | null } | null } | null;
}

async function emitToProjectAudience(
  projectId: string,
  event: string,
  payload: ProjectAudiencePayload,
): Promise<void> {
  if (!io) return;
  const ownerId = await getProjectOwner(projectId);
  const sockets = await io.in(`project:${projectId}`).fetchSockets();
  const task = payload.task ?? payload.activity?.task ?? null;

  for (const socket of sockets) {
    const u = socket.data.user as SocketUser | undefined;
    if (!u) continue;
    if (u.role === ROLES.ADMIN) {
      socket.emit(event, payload);
    } else if (u.role === ROLES.PROJECT_MANAGER) {
      if (ownerId === u.id) socket.emit(event, payload);
    } else if (u.role === ROLES.DEVELOPER && task?.assignedDeveloperId === u.id) {
      socket.emit(event, payload);
    }
  }
}

export async function emitTaskUpdated(task: { projectId: string; assignedDeveloperId: string | null }): Promise<void> {
  if (!io) return;
  await emitToProjectAudience(task.projectId, 'task:updated', { task });
}

export async function emitActivityCreated(activity: { projectId: string; task: { assignedDeveloperId: string | null } | null }): Promise<void> {
  if (!io) return;
  await emitToProjectAudience(activity.projectId, 'activity:new', { activity });
  io.to('admin').emit('activity:new', { activity });
}

export async function emitNotificationToUser(
  userId: string,
  notification: Record<string, unknown>,
): Promise<void> {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', { notification });
}

export function broadcastPresence(): void {
  if (!io) return;
  io.to('admin').emit('presence:update', {
    onlineUsers: getOnlineUsers(),
    count: getOnlineUserCount(),
  });
}

export function getOnlineUserCount(): number {
  return connections.size;
}

export function getOnlineUsers(): PresenceUser[] {
  return [...presenceUsers.values()];
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function invalidateProjectOwner(projectId: string): void {
  projectOwners.delete(projectId);
}
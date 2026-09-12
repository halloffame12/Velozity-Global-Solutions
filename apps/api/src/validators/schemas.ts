import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format').max(100),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(100).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(150),
  description: z.string().max(1000).optional(),
  clientId: z.string().uuid('Invalid client ID'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(1000).optional(),
  clientId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid('Invalid project ID'),
  assignedDeveloperId: z.string().uuid('Invalid user ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assignedDeveloperId: z.string().uuid().nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.coerce.date().optional(),
});

const statusValues = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const priorityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const taskFilterSchema = z
  .object({
    status: z.enum(statusValues).optional(),
    priority: z.enum(priorityValues).optional(),
    dueFrom: z.coerce.date().optional(),
    dueTo: z.coerce.date().optional(),
    projectId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .refine(data => !data.dueFrom || !data.dueTo || data.dueFrom <= data.dueTo, {
    path: ['dueTo'],
    message: 'dueTo must be on or after dueFrom',
  });

export const activityQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
});
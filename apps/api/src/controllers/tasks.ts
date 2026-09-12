import { asyncHandler } from '../lib/errors';
import { createTask, listTasks, getTask, updateTask, TaskFilters } from '../services/tasks';
import { AuthenticatedRequest } from '../middleware/auth';

export const createTaskHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const task = await createTask(
    { userId: req.user!.userId, role: req.user!.role },
    req.body,
  );
  res.status(201).json({
    success: true,
    data: { task },
  });
});

export const getTasksHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = await listTasks(
    { userId: req.user!.userId, role: req.user!.role },
    req.query as unknown as TaskFilters,
  );
  res.status(200).json({
    success: true,
    data,
  });
});

export const getTaskByIdHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const task = await getTask(
    { userId: req.user!.userId, role: req.user!.role },
    req.params.taskId,
  );
  res.status(200).json({
    success: true,
    data: { task },
  });
});

export const updateTaskHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const task = await updateTask(
    { userId: req.user!.userId, role: req.user!.role },
    req.params.taskId,
    req.body,
  );
  res.status(200).json({
    success: true,
    data: { task },
  });
});
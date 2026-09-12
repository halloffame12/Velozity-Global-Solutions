import { asyncHandler } from '../lib/errors';
import { createProject, listProjects, getProject, updateProject, deleteProject } from '../services/projects';
import { AuthenticatedRequest } from '../middleware/auth';

export const createProjectHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const project = await createProject(
    { userId: req.user!.userId, role: req.user!.role },
    req.body,
  );
  res.status(201).json({
    success: true,
    data: { project },
  });
});

export const getProjectsHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const projects = await listProjects({ userId: req.user!.userId, role: req.user!.role });
  res.status(200).json({
    success: true,
    data: { projects },
  });
});

export const getProjectByIdHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = await getProject(
    { userId: req.user!.userId, role: req.user!.role },
    req.params.projectId,
  );
  res.status(200).json({
    success: true,
    data,
  });
});

export const updateProjectHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const project = await updateProject(
    { userId: req.user!.userId, role: req.user!.role },
    req.params.projectId,
    req.body,
  );
  res.status(200).json({
    success: true,
    data: { project },
  });
});

export const deleteProjectHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await deleteProject(
    { userId: req.user!.userId, role: req.user!.role },
    req.params.projectId,
  );
  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});
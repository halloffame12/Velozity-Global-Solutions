import { Router } from 'express';
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from '../controllers/projects';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.post('/', authorize('ADMIN', 'PROJECT_MANAGER'), validateBody(createProjectSchema), createProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:projectId', getProjectByIdHandler);
router.put('/:projectId', authorize('ADMIN', 'PROJECT_MANAGER'), validateBody(updateProjectSchema), updateProjectHandler);
router.delete('/:projectId', authorize('ADMIN', 'PROJECT_MANAGER'), deleteProjectHandler);

export default router;

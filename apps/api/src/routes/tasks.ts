import { Router } from 'express';
import { createTaskHandler, getTasksHandler, getTaskByIdHandler, updateTaskHandler } from '../controllers/tasks';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.post('/', authorize('ADMIN', 'PROJECT_MANAGER'), validateBody(createTaskSchema), createTaskHandler);
router.get('/', validateQuery(taskFilterSchema), getTasksHandler);
router.get('/:taskId', getTaskByIdHandler);
router.put('/:taskId', validateBody(updateTaskSchema), updateTaskHandler);

export default router;
import { Router } from 'express';
import { getUsersHandler, createUserHandler } from '../controllers/users';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createUserSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
// Admins see everyone; PMs are allowed the same list so they can assign work,
// but the controller narrows it to developers for non-admins.
router.get('/', authorize('ADMIN', 'PROJECT_MANAGER'), getUsersHandler);
router.post('/', authorize('ADMIN'), validateBody(createUserSchema), createUserHandler);

export default router;

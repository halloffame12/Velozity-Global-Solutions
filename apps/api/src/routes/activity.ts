import { Router } from 'express';
import { getActivityLogs, getRecentActivity } from '../controllers/activity';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { activityQuerySchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.get('/', validateQuery(activityQuerySchema), getActivityLogs);
router.get('/recent', validateQuery(activityQuerySchema), getRecentActivity);

export default router;
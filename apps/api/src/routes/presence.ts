import { Router } from 'express';
import { getOnlineUsersHandler } from '../controllers/presence';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/users/online', authorize('ADMIN'), getOnlineUsersHandler);

export default router;

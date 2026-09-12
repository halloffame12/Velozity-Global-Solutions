import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getDashboardStats);

export default router;
import { Router } from 'express';
import { getNotificationsHandler, markReadHandler, markAllReadHandler } from '../controllers/notifications';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getNotificationsHandler);
router.put('/read-all', markAllReadHandler);
router.put('/:notificationId/read', markReadHandler);

export default router;
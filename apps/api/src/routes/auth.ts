import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { loginSchema } from '../validators/schemas';

const router = Router();

router.post('/login', validateBody(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;

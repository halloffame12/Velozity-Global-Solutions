import { Router } from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import taskRoutes from './tasks';
import clientRoutes from './clients';
import activityRoutes from './activity';
import notificationRoutes from './notifications';
import userRoutes from './users';
import presenceRoutes from './presence';
import dashboardRoutes from './dashboard';
import { notFoundHandler, errorHandler } from '../middleware/errorHandler';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/clients', clientRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', presenceRoutes);

router.use(notFoundHandler);

export { router as routes, errorHandler };
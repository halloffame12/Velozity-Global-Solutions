import { Router } from 'express';
import { createClientHandler, getClientsHandler, getClientByIdHandler, updateClientHandler, deleteClientHandler } from '../controllers/clients';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createClientSchema, updateClientSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.post('/', authorize('ADMIN'), validateBody(createClientSchema), createClientHandler);
router.get('/', getClientsHandler);
router.get('/:clientId', getClientByIdHandler);
router.put('/:clientId', authorize('ADMIN'), validateBody(updateClientSchema), updateClientHandler);
router.delete('/:clientId', authorize('ADMIN'), deleteClientHandler);

export default router;

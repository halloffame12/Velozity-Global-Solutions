import { asyncHandler } from '../lib/errors';
import { createClient, listClients, getClient, updateClient, deleteClient } from '../services/clients';
import { AuthenticatedRequest } from '../middleware/auth';

const actor = (req: AuthenticatedRequest) => ({ userId: req.user!.userId, role: req.user!.role });

export const createClientHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const client = await createClient(actor(req), req.body);
  res.status(201).json({ success: true, data: { client } });
});

export const getClientsHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const clients = await listClients(actor(req));
  res.status(200).json({ success: true, data: { clients } });
});

export const getClientByIdHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const client = await getClient(actor(req), req.params.clientId);
  res.status(200).json({ success: true, data: { client } });
});

export const updateClientHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const client = await updateClient(actor(req), req.params.clientId, req.body);
  res.status(200).json({ success: true, data: { client } });
});

export const deleteClientHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await deleteClient(actor(req), req.params.clientId);
  res.status(200).json({ success: true, message: 'Client deleted successfully' });
});
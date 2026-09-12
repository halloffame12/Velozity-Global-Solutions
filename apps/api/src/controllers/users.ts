import { asyncHandler, AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { ROLES } from '../config/constants';
import { AuthenticatedRequest } from '../middleware/auth';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export const getUsersHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Admins see everyone; project managers only see developers, which is all
  // they need for assigning tasks.
  const where =
    req.user!.role === ROLES.ADMIN
      ? {}
      : { role: ROLES.DEVELOPER };
  const users = await prisma.user.findMany({
    where,
    select: safeUserSelect,
    orderBy: { name: 'asc' },
  });
  res.status(200).json({
    success: true,
    data: { users },
  });
});

export const createUserHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== ROLES.ADMIN) {
    throw new AppError(403, 'FORBIDDEN', 'Only admins can create users');
  }
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A user with this email already exists');
  }
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      passwordHash: hashPassword(req.body.password),
      role: req.body.role,
    },
    select: safeUserSelect,
  });
  res.status(201).json({
    success: true,
    data: { user },
  });
});
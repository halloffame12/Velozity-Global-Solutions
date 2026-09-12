import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../lib/auth';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

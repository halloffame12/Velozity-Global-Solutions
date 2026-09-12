import { ErrorRequestHandler, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

function isPrismaKnownError(err: Error): boolean {
  return 'code' in err && typeof (err as any).code === 'string' && (err as any).code.startsWith('P');
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma unique constraint violations come back as driver errors, not handled 500s.
  if (isPrismaKnownError(err)) {
    const driver = err as any;
    if (driver.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        code: 'CONFLICT',
      });
      return;
    }
    if (driver.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'The requested record does not exist',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
};

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
}
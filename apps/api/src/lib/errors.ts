import { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundError(resource: string, id?: string): AppError {
  return new AppError(404, 'NOT_FOUND', `${resource}${id ? ` ${id}` : ''} not found`);
}

export function forbiddenError(message: string): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function badRequestError(message: string): AppError {
  return new AppError(400, 'BAD_REQUEST', message);
}

export function unauthorizedError(message: string): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { logger } from '../utils/logger.js';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    res.status(400).json({
      error: 'Validation failed',
      details: validationError.message,
    });
    return;
  }

  if (err instanceof Error) {
    logger.error(err, 'Unhandled API Error');
  }

  res.status(500).json({ error: 'Internal server error' });
}

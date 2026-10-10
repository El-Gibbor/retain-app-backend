import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../utils/http-error';

export interface ErrorResponse {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorResponse = { error: { message: `Route ${req.method} ${req.path} not found` } };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } } satisfies ErrorResponse);
    return;
  }

  if (err instanceof z.ZodError) {
    const { fieldErrors } = z.flattenError(err);
    res.status(400).json({
      error: { message: 'Validation failed', details: fieldErrors as Record<string, string[]> },
    } satisfies ErrorResponse);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { message: 'Resource already exists' } } satisfies ErrorResponse);
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { message: 'Resource not found' } } satisfies ErrorResponse);
      return;
    }
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'Invalid JSON body' } } satisfies ErrorResponse);
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } } satisfies ErrorResponse);
};

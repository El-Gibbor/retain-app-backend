import type { Request, RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { verifyToken } from '../utils/jwt';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Authentication required');
  }

  try {
    const { sub, role } = verifyToken(header.slice('Bearer '.length));
    req.user = { id: sub, role };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  next();
};

// Must run after requireAuth
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
  }
  next();
};

export const getAuthUser = (req: Request): AuthUser => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  return req.user;
};

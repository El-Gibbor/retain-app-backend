import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { TokenPayload } from '../types/auth';

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, role: decoded.role };
};

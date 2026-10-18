import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWT_DURATION_PATTERN } from '../config/duration';
import { env } from '../config/env';
import { Role } from '../generated/prisma/client';
import type { TokenPayload } from '../types/auth';

type JwtDuration = Extract<NonNullable<SignOptions['expiresIn']>, string>;

// Same pattern as the startup env check, so a configured value always narrows here
const isJwtDuration = (value: string): value is JwtDuration => JWT_DURATION_PATTERN.test(value);

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && Object.values<string>(Role).includes(value);

export const signToken = (payload: TokenPayload): string => {
  if (!isJwtDuration(env.JWT_EXPIRES_IN)) {
    throw new Error(`Invalid JWT_EXPIRES_IN: ${env.JWT_EXPIRES_IN}`);
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !isRole(decoded.role)) {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, role: decoded.role };
};

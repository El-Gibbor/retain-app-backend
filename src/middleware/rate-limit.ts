import { rateLimit } from 'express-rate-limit';
import type { ErrorResponse } from './error-handler';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Only failed attempts count, so normal sign-ins never hit the limit
export const authRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ErrorResponse = {
      error: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
    };
    res.status(429).json(body);
  },
});

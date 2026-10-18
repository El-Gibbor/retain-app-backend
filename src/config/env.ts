import 'dotenv/config';
import { z } from 'zod';
import { JWT_DURATION_PATTERN } from './duration';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(JWT_DURATION_PATTERN, 'JWT_EXPIRES_IN must look like 7d, 12h or 3600')
    .default('7d'),
});

// Stop the server if required env vars are missing or invalid
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

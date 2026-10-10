import { z } from 'zod';

const email = z.email('Enter a valid email address').trim().toLowerCase();

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email,
  // bcrypt ignores anything past 72 bytes
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

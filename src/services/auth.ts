import type { User } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import type { SignInInput, SignUpInput } from '../schemas/auth';
import type { AuthResponse, PublicUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { signToken } from '../utils/jwt';

export const toPublicUser = ({ id, name, email, role, createdAt }: User): PublicUser => ({
  id,
  name,
  email,
  role,
  createdAt,
});

const buildAuthResponse = (user: User): AuthResponse => ({
  token: signToken({ sub: user.id, role: user.role }),
  user: toPublicUser(user),
});

export async function signUp({ name, email, password }: SignUpInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  return buildAuthResponse(user);
}

export async function signIn({ email, password }: SignInInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return buildAuthResponse(user);
}

export async function getCurrentUser(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(401, 'Account no longer exists');
  }
  return toPublicUser(user);
}

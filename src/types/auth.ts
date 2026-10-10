import type { Role } from '../generated/prisma/client';

export interface AuthUser {
  id: string;
  role: Role;
}

export interface TokenPayload {
  sub: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

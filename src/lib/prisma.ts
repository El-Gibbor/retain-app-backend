import net from 'node:net';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

// Node's 250ms per-address connect attempt is too tight for high-latency links to the database
net.setDefaultAutoSelectFamilyAttemptTimeout(1000);

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 15_000 });

export const prisma = new PrismaClient({ adapter });

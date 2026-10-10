import 'dotenv/config';
import { z } from 'zod';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const DEFAULT_CATEGORY = 'Uncategorized';

const STARTER_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Personal Care',
];

const adminSchema = z.object({
  ADMIN_NAME: z.string().min(1).default('Retain Admin'),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
});

async function seedCategories() {
  await prisma.category.upsert({
    where: { name: DEFAULT_CATEGORY },
    update: { isDefault: true },
    create: { name: DEFAULT_CATEGORY, isDefault: true },
  });

  for (const name of STARTER_CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = adminSchema.parse(process.env);
  const email = ADMIN_EMAIL.toLowerCase();

  // Existing admin keeps their current password
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      name: ADMIN_NAME,
      email,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });
}

async function main() {
  await seedCategories();
  await seedAdmin();
  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

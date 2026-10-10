import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Migrations need a direct connection, not the pooler
  datasource: {
    url: env('DATABASE_URL_UNPOOLED'),
  },
});

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Migrations run DDL over a direct connection (Neon's pooler is for app traffic).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? 'postgresql://localhost:5432/congrats',
  },
});

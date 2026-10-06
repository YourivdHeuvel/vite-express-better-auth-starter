import { defineConfig, env } from 'prisma/config'

// Prisma doesn't read .env on its own; load it if present (CI/production set real env vars).
try {
  process.loadEnvFile()
} catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})

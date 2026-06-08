import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use process.env directly with a fallback so prisma generate
    // doesn't throw during build when DATABASE_URL isn't set yet.
    // The real URL is injected at runtime by Railway.
    url: process.env['DATABASE_URL'] ?? '',
  },
})
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// This Prisma client points at the TEST database, not dev.
// It reads from .env.test via the DATABASE_URL set in the test environment.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const testPrisma = new PrismaClient({ adapter })

// Wipes all tables between tests so each test starts with a clean slate.
// Order matters — delete child records before parent records to avoid
// foreign key constraint violations.
export const cleanDatabase = async () => {
  await testPrisma.refreshToken.deleteMany()
  await testPrisma.post.deleteMany()
  await testPrisma.user.deleteMany()
}
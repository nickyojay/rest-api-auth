import { testPrisma } from './helpers'

export default async function globalTeardown() {
  await testPrisma.$disconnect()
}
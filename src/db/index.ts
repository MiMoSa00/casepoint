import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  })
}

const prisma = globalThis.cachedPrisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.cachedPrisma = prisma
}

export const db = prisma
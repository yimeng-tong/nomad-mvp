import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!prisma) prisma = new PrismaClient({ datasources: { db: { url } } });
  return prisma;
}



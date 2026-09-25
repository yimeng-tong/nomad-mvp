import type { AuthRuntimeConfig } from './runtime-config.js';
import { AuthFault } from './errors.js';
import { getPrisma } from '../db/prisma.js';
import { PrismaAuthRepository } from './prisma-repository.js';
import { PnvsProofProvider } from './pnvs-provider.js';
import { PersistentAuthService } from './service.js';

export async function createPersistentAuthRuntime(config: AuthRuntimeConfig) {
  if (config.provider.kind !== 'aliyun-pnvs' || config.captcha.kind !== 'aliyun-pnvs'
    || config.loginMethods.some((method) => method !== 'phone')) throw new AuthFault('AUTH_IMPLEMENTATION_UNAVAILABLE', 503);
  if (!config.databaseUrl || config.databaseUrl !== process.env.DATABASE_URL?.trim()) throw new AuthFault('AUTH_CONFIGURATION_INVALID', 503);
  const db = getPrisma();
  if (!db) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
  try {
    const repository = new PrismaAuthRepository(db);
    await repository.ready();
    const proof = new PnvsProofProvider(config.provider, config.captcha);
    return new PersistentAuthService(config, repository, proof);
  } catch (error) {
    await db.$disconnect();
    if (error instanceof AuthFault) throw error;
    throw new AuthFault('AUTH_IMPLEMENTATION_UNAVAILABLE', 503);
  }
}

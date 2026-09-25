/** Controlled local maintenance. Never expose this entry as an HTTP route or bundle it into a client. */
import { readFile, stat } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { changeOperatorGrant, operatorCapabilities, validOperatorScope } from '../src/auth/operator.js';
import { AuthFault } from '../src/auth/errors.js';

const schema = z.object({ ownerId: z.string().uuid(), capability: z.enum(operatorCapabilities), scope: z.string().refine(validOperatorScope),
  expectedVersion: z.number().int().nonnegative(), enabled: z.boolean(), approvedBy: z.string().min(1).max(128), evidence: z.string().min(1).max(512) }).strict();
const [path, flag] = process.argv.slice(2);
let db: PrismaClient | undefined;
try {
  if (!path || flag && flag !== '--apply') throw new AuthFault('AUTH_PARAMS_INVALID', 400);
  const info = await stat(path);
  if (info.size > 8192 || (info.mode & 0o077) !== 0) throw new AuthFault('AUTH_MAINTENANCE_FILE_INVALID', 400);
  const input = schema.parse(JSON.parse(await readFile(path, 'utf8')));
  if (!flag) console.log(JSON.stringify({ validated: true, changesApplied: false, capability: input.capability, scope: input.scope, expectedVersion: input.expectedVersion, enabled: input.enabled }));
  else {
    db = new PrismaClient(); const result = await changeOperatorGrant(db, input);
    console.log(JSON.stringify({ changesApplied: true, grantId: result.id, version: result.version, enabled: result.enabled }));
  }
} catch (error) {
  console.error(JSON.stringify({ code: error instanceof AuthFault ? error.code : 'AUTH_MAINTENANCE_FAILED', changesApplied: false })); process.exitCode = 1;
} finally { await db?.$disconnect(); }

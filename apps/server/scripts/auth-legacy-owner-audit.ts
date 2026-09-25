import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auditLegacyClaim } from '../src/auth/legacy-owner.js';

// Intentionally read-only. Applying a claim is a separately authorized retained-data operation.
const path = process.env.AUTH_LEGACY_CLAIMS_FILE;
if (!path) throw new Error('AUTH_LEGACY_CLAIMS_FILE is required; keep private identity claims outside Git');
const claimsSchema = z.array(z.object({
  legacyActor: z.string().min(1).max(128), ownerId: z.string().uuid(), verifiedPhone: z.string().min(6).max(32),
  evidenceReference: z.string().min(1).max(512), approvedBy: z.string().min(1).max(128),
}).strict()).max(1000);
const db = new PrismaClient();
try {
  const claims = claimsSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  const results = [];
  for (const claim of claims) results.push(await auditLegacyClaim(db, claim));
  process.stdout.write(`${JSON.stringify({ changesApplied: false, results }, null, 2)}\n`);
} catch {
  process.stderr.write('{"code":"AUTH_MIGRATION_AUDIT_FAILED","changesApplied":false}\n');
  process.exitCode = 1;
} finally { await db.$disconnect(); }

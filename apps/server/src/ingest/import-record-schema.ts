import type { PrismaClient } from '@prisma/client';
import { AuthFault, authAuthority } from '../auth/errors.js';

/** Fail before worker startup if the additive owner and protected-URL guards are absent. */
export async function assertImportRecordSchema(db: PrismaClient): Promise<void> {
  await authAuthority(async () => {
    await db.$queryRaw`SELECT id,"userId",job_id,normalized_url,active_normalized_url,normalization_version,original_url_protected,status,deleted_at FROM "ImportRecord" LIMIT 0`;
    await db.$queryRaw`SELECT deleted_at FROM "IngestJob" LIMIT 0`;
    await db.$queryRaw`SELECT deleted_at FROM "Inspiration" LIMIT 0`;
    const rows = await db.$queryRaw<Array<{ ok: boolean }>>`SELECT (
      NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
        WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_userId_normalized_url_key')
      AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
        WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_userId_active_normalized_url_key' AND i.indisunique)
      AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
        WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_id_userId_key' AND i.indisunique)
      AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
        WHERE i.indrelid='"IngestJob"'::regclass AND c.relname='IngestJob_id_userId_key' AND i.indisunique)
      AND (SELECT count(*) FROM pg_constraint WHERE conrelid='"ImportRecord"'::regclass AND convalidated
        AND conname IN ('ImportRecord_userId_fkey','ImportRecord_job_id_userId_fkey','ImportRecord_normalized_url_check','ImportRecord_protected_url_check','ImportRecord_active_url_check'))=5
      AND EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='"Inspiration"'::regclass AND convalidated
        AND conname='Inspiration_import_record_id_userId_fkey')
    ) AS ok`;
    if (!rows[0]?.ok) throw new AuthFault('INGEST_SCHEMA_NOT_READY', 503, true);
  });
}

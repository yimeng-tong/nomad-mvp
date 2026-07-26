import { Prisma, type PrismaClient } from '@prisma/client';

type SqlClient = Pick<PrismaClient, '$queryRaw' | '$executeRaw'>;

export async function refreshAnchorPoolForCity(
  client: SqlClient,
  cityId: string,
  ttlDays = 30,
) {
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
  await client.$executeRaw(Prisma.sql`
    UPDATE "AnchorPoolEntry"
    SET active = FALSE
    WHERE "cityId" = ${cityId}::uuid
  `);
  await client.$executeRaw(Prisma.sql`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               ORDER BY verified_at DESC NULLS LAST, updated_at DESC, id
             )::int AS position
      FROM "CanonicalPOI"
      WHERE "cityId" = ${cityId}::uuid AND verified = TRUE
      LIMIT 50
    )
    INSERT INTO "AnchorPoolEntry" (
      id, "cityId", "poiId", rank, active, refreshed_at, expires_at
    )
    SELECT md5(${cityId}::text || ':' || ranked.id::text)::uuid,
           ${cityId}::uuid, ranked.id,
           51 - ranked.position, TRUE, NOW(), ${expiresAt}
    FROM ranked
    ON CONFLICT ("cityId", "poiId") DO UPDATE
    SET rank = EXCLUDED.rank,
        active = TRUE,
        refreshed_at = NOW(),
        expires_at = EXCLUDED.expires_at
  `);
}

export async function ensureAnchorPoolForCity(client: SqlClient, cityName: string) {
  const cities = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "City" WHERE name = ${cityName} ORDER BY id LIMIT 1
  `);
  if (cities[0]) await refreshAnchorPoolForCity(client, cities[0].id);
}

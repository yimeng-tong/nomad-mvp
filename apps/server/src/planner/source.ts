import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { getPrisma } from '../db/prisma.js';
import { dbUserIdFor } from '../ingest/store.js';
import { AmapSearchUnavailableError, searchAmapPoi } from '../integrations/amap.js';
import { ensureAnchorPoolForCity, refreshAnchorPoolForCity } from './anchor-pool.js';
import {
  BUILT_IN_POI_DATA_VERSION,
  getBuiltInPoiManifest,
} from './built-in-pois.js';
import { resolveCityTimezone } from './city-timezones.js';
import type { PlannerSourceInspiration, PlannerSourceRepository } from './resolver.js';
import type { ResolvedPlannerItem, ResolvedPoi } from './types.js';

type PoiRow = {
  poi_id: string;
  amap_id: string | null;
  poi_name: string;
  poi_address: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  verified: boolean;
  quality_grade: ResolvedPoi['quality'];
  source_attribution: string | null;
  l1_area_id: string | null;
  l2_group_id: string | null;
  open_hours_json: Prisma.JsonValue | null;
};

function stableUuid(value: string) {
  const hex = createHash('sha256').update(value).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function mapPoi(row: PoiRow): ResolvedPoi {
  return {
    poiId: row.poi_id,
    amapId: row.amap_id,
    name: row.poi_name,
    address: row.poi_address,
    latitude: row.latitude?.toNumber() ?? null,
    longitude: row.longitude?.toNumber() ?? null,
    verified: row.verified,
    quality: row.quality_grade,
    sourceAttribution: row.source_attribution,
    l1AreaId: row.l1_area_id,
    l2GroupId: row.l2_group_id,
    openHours: (row.open_hours_json ?? null) as ResolvedPoi['openHours'],
  };
}

export class PrismaPlannerSourceRepository implements PlannerSourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getInspirations(userId: string, itemIds: string[]) {
    if (itemIds.length === 0) return [];
    const rows = await this.prisma.$queryRaw<
      Array<PoiRow & { item_id: string; inspiration_id: string; title: string | null }>
    >(Prisma.sql`
      SELECT inspiration.id AS item_id,
             inspiration.id AS inspiration_id,
             inspiration.title,
             poi.id AS poi_id,
             poi.amap_id,
             poi.name AS poi_name,
             poi.address AS poi_address,
             poi.latitude,
             poi.longitude,
             poi.verified,
             poi.quality_grade,
             poi.source_attribution,
             poi.open_hours_json,
             membership.l1_area_id,
             membership.l2_group_id
      FROM "Inspiration" inspiration
      LEFT JOIN "CanonicalPOI" poi ON poi.id = inspiration."poiId"
      LEFT JOIN LATERAL (
        SELECT l1.id AS l1_area_id, membership."l2GroupId" AS l2_group_id
        FROM "PoiMembership" membership
        JOIN "L2Group" l2 ON l2.id = membership."l2GroupId"
        JOIN "L1Area" l1 ON l1.id = l2."l1AreaId"
        WHERE membership."poiId" = poi.id
        ORDER BY membership.priority DESC, membership."l2GroupId"
        LIMIT 1
      ) membership ON TRUE
      WHERE inspiration."userId" = ${dbUserIdFor(userId)}::uuid
        AND inspiration.id::text IN (${Prisma.join(itemIds)})
    `);
    return rows.map(
      (row): PlannerSourceInspiration => ({
        itemId: row.item_id,
        inspirationId: row.inspiration_id,
        title: row.title,
        poi: row.poi_id ? mapPoi(row) : null,
      }),
    );
  }

  async getPoiByReference(city: string, reference: string) {
    const rows = await this.prisma.$queryRaw<PoiRow[]>(Prisma.sql`
      SELECT poi.id AS poi_id,
             poi.amap_id,
             poi.name AS poi_name,
             poi.address AS poi_address,
             poi.latitude,
             poi.longitude,
             poi.verified,
             poi.quality_grade,
             poi.source_attribution,
             poi.open_hours_json,
             membership.l1_area_id,
             membership.l2_group_id
      FROM "CanonicalPOI" poi
      JOIN "City" city ON city.id = poi."cityId"
      LEFT JOIN LATERAL (
        SELECT l1.id AS l1_area_id, membership."l2GroupId" AS l2_group_id
        FROM "PoiMembership" membership
        JOIN "L2Group" l2 ON l2.id = membership."l2GroupId"
        JOIN "L1Area" l1 ON l1.id = l2."l1AreaId"
        WHERE membership."poiId" = poi.id
        ORDER BY membership.priority DESC, membership."l2GroupId"
        LIMIT 1
      ) membership ON TRUE
      WHERE city.name = ${city}
        AND (poi.id::text = ${reference} OR poi.amap_id = ${reference})
      ORDER BY poi.verified DESC, poi.updated_at DESC
      LIMIT 1
    `);
    return rows[0] ? mapPoi(rows[0]) : null;
  }

  async searchPoi(city: string, query: string) {
    try {
      const results = await searchAmapPoi(city, query, 5);
      const mapped = results.map(
        (result): ResolvedPoi => ({
          poiId: stableUuid(`poi:${result.poi_id}`),
          amapId: result.poi_id,
          name: result.name,
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          verified: true,
          quality: 'verified',
          sourceAttribution: 'amap:text-search',
          l1AreaId: null,
          l2GroupId: null,
          openHours: null,
        }),
      );
      if (mapped.length > 0) {
        await this.prisma.$transaction(async (tx) => {
          let cities = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id FROM "City" WHERE name = ${city} ORDER BY id LIMIT 1
          `);
          if (!cities[0]) {
            const timezone = resolveCityTimezone(city);
            cities = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
              INSERT INTO "City" (id, name, tz)
              VALUES (${randomUUID()}::uuid, ${city}, ${timezone})
              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
              RETURNING id
            `);
          }
          for (let index = 0; index < mapped.length; index += 1) {
            const poi = mapped[index]!;
            const providerResult = results[index]!;
            const persisted = await tx.$queryRaw<Array<{
              id: string;
              latitude: Prisma.Decimal | null;
              longitude: Prisma.Decimal | null;
            }>>(Prisma.sql`
              INSERT INTO "CanonicalPOI" (
                id, "cityId", name, address, amap_id, provider, verified,
                latitude, longitude, verified_at, provider_snapshot_json, quality_grade,
                source_attribution, created_at, updated_at
              )
              VALUES (
                ${poi.poiId}::uuid, ${cities[0]!.id}::uuid, ${poi.name}, ${poi.address},
                ${poi.amapId}, 'amap', TRUE, ${poi.latitude}, ${poi.longitude}, NOW(),
                ${JSON.stringify(providerResult)}::jsonb, 'verified'::"QualityGrade",
                'amap:text-search', NOW(), NOW()
              )
              ON CONFLICT (amap_id) DO UPDATE
              SET name = EXCLUDED.name,
                  address = EXCLUDED.address,
                  amap_id = EXCLUDED.amap_id,
                  latitude = COALESCE(EXCLUDED.latitude, "CanonicalPOI".latitude),
                  longitude = COALESCE(EXCLUDED.longitude, "CanonicalPOI".longitude),
                  provider = EXCLUDED.provider,
                  verified = TRUE,
                  verified_at = NOW(),
                  provider_snapshot_json = EXCLUDED.provider_snapshot_json,
                  quality_grade = 'verified'::"QualityGrade",
                  source_attribution = EXCLUDED.source_attribution,
                  updated_at = NOW()
              RETURNING id, latitude, longitude
            `);
            mapped[index] = {
              ...poi,
              poiId: persisted[0]!.id,
              latitude: persisted[0]!.latitude?.toNumber() ?? null,
              longitude: persisted[0]!.longitude?.toNumber() ?? null,
            };
          }
          await refreshAnchorPoolForCity(tx as any, cities[0]!.id);
        });
      }
      return mapped;
    } catch (error) {
      if (error instanceof AmapSearchUnavailableError) return [];
      throw error;
    }
  }

  async getEvidenceConstraints(userId: string, itemIds: string[]) {
    if (itemIds.length === 0) return [];
    const rows = await this.prisma.$queryRaw<Array<{
      item_id: string;
      poi_id: string | null;
      date: Date | null;
      start_local: string | null;
      end_local: string | null;
      timezone: string;
      time_hint: 'dawn' | 'morning' | 'afternoon' | 'sunset' | 'evening' | 'night' | 'night_market';
      source: 'uploaded_inspiration' | 'reservation' | 'ticket';
      evidence_ref: string;
      source_attribution: string | null;
      quality: 'verified' | 'high' | 'medium' | 'low';
    }>>(Prisma.sql`
      SELECT DISTINCT ON (evidence.inspiration_id)
             evidence.inspiration_id::text AS item_id,
             evidence."poiId" AS poi_id,
             evidence.date,
             evidence.start_local,
             evidence.end_local,
             evidence.timezone,
             evidence.time_hint,
             evidence.source,
             evidence.evidence_ref,
             evidence.source_attribution,
             evidence.quality
      FROM "InspirationEvidence" evidence
      JOIN "Inspiration" inspiration ON inspiration.id = evidence.inspiration_id
      WHERE inspiration."userId" = ${dbUserIdFor(userId)}::uuid
        AND evidence.inspiration_id::text IN (${Prisma.join(itemIds)})
      ORDER BY evidence.inspiration_id,
               CASE evidence.quality
                 WHEN 'verified' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 ELSE 4
               END,
               CASE evidence.source
                 WHEN 'ticket' THEN 1
                 WHEN 'reservation' THEN 2
                 ELSE 3
               END,
               CASE evidence.time_hint
                 WHEN 'dawn' THEN 1
                 WHEN 'sunset' THEN 2
                 WHEN 'night_market' THEN 3
                 WHEN 'night' THEN 4
                 WHEN 'evening' THEN 5
                 WHEN 'morning' THEN 6
                 ELSE 7
               END,
               evidence.id
    `);
    return rows.map((row) => ({
      itemId: row.item_id,
      poiId: row.poi_id,
      date: row.date?.toISOString().slice(0, 10) ?? null,
      startLocal: row.start_local,
      endLocal: row.end_local,
      timezone: row.timezone,
      timeHint: row.time_hint,
      source: row.source,
      evidenceRef: row.evidence_ref,
      sourceAttribution: row.source_attribution,
      quality: row.quality,
    }));
  }

  async getAnchorPool(city: string) {
    await ensureAnchorPoolForCity(this.prisma, city);
    const rows = await this.prisma.$queryRaw<PoiRow[]>(Prisma.sql`
      SELECT poi.id AS poi_id,
             poi.amap_id,
             poi.name AS poi_name,
             poi.address AS poi_address,
             poi.latitude,
             poi.longitude,
             poi.verified,
             poi.quality_grade,
             COALESCE(poi.source_attribution, 'anchor_pool') AS source_attribution,
             poi.open_hours_json,
             membership.l1_area_id,
             membership.l2_group_id
      FROM "AnchorPoolEntry" pool
      JOIN "City" city ON city.id = pool."cityId"
      JOIN "CanonicalPOI" poi ON poi.id = pool."poiId"
      LEFT JOIN LATERAL (
        SELECT l1.id AS l1_area_id, membership."l2GroupId" AS l2_group_id
        FROM "PoiMembership" membership
        JOIN "L2Group" l2 ON l2.id = membership."l2GroupId"
        JOIN "L1Area" l1 ON l1.id = l2."l1AreaId"
        WHERE membership."poiId" = poi.id
        ORDER BY membership.priority DESC, membership."l2GroupId"
        LIMIT 1
      ) membership ON TRUE
      WHERE city.name = ${city}
        AND pool.active = TRUE
        AND pool.expires_at > NOW()
        AND poi.verified = TRUE
      ORDER BY pool.rank DESC, pool.refreshed_at DESC, pool.id
      LIMIT 50
    `);
    return rows.map(
      (row): ResolvedPlannerItem => ({
        itemId: `anchor-${row.poi_id}`,
        inspirationId: null,
        poi: mapPoi(row),
        source: 'anchor_pool',
        timeHint: null,
        stayMinutesHint: null,
        required: false,
      }),
    );
  }

  async getBuiltInFallback(city: string) {
    const manifest = getBuiltInPoiManifest(city);
    if (manifest.length === 0) return [];
    let cities = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "City" WHERE name = ${city} ORDER BY id LIMIT 1
    `);
    if (!cities[0]) {
      const timezone = resolveCityTimezone(city);
      cities = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO "City" (id, name, tz)
        VALUES (${randomUUID()}::uuid, ${city}, ${timezone})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `);
    }
    const cityId = cities[0]!.id;
    await this.prisma.$transaction(async (tx) => {
      for (const entry of manifest) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "BuiltInPoiEntry" (
            id, "cityId", data_version, rank, name, created_at, updated_at
          )
          VALUES (
            ${randomUUID()}::uuid, ${cityId}::uuid, ${BUILT_IN_POI_DATA_VERSION},
            ${entry.rank}, ${entry.name}, NOW(), NOW()
          )
          ON CONFLICT ("cityId", data_version, rank) DO UPDATE
          SET name = EXCLUDED.name, updated_at = NOW()
        `);
      }
      await tx.$executeRaw(Prisma.sql`
        UPDATE "BuiltInPoiEntry" entry
        SET "poiId" = poi.id, updated_at = NOW()
        FROM "CanonicalPOI" poi
        WHERE entry."cityId" = ${cityId}::uuid
          AND entry.data_version = ${BUILT_IN_POI_DATA_VERSION}
          AND entry."poiId" IS NULL
          AND poi."cityId" = entry."cityId"
          AND poi.name = entry.name
          AND poi.verified = TRUE
          AND poi.latitude IS NOT NULL
          AND poi.longitude IS NOT NULL
      `);
    });

    const missing = await this.prisma.$queryRaw<Array<{
      id: string;
      rank: number;
      name: string;
    }>>(Prisma.sql`
      SELECT entry.id, entry.rank, entry.name
      FROM "BuiltInPoiEntry" entry
      LEFT JOIN "CanonicalPOI" poi ON poi.id = entry."poiId"
      WHERE entry."cityId" = ${cityId}::uuid
        AND entry.data_version = ${BUILT_IN_POI_DATA_VERSION}
        AND (
          entry."poiId" IS NULL OR
          poi.latitude IS NULL OR
          poi.longitude IS NULL
        )
      ORDER BY entry.rank
    `);
    const hydrationConcurrency = 3;
    for (let offset = 0; offset < missing.length; offset += hydrationConcurrency) {
      const batch = missing.slice(offset, offset + hydrationConcurrency);
      const matches = await Promise.all(
        batch.map(async (entry) => {
          const candidates = await this.searchPoi(city, entry.name);
          const normalizedName = entry.name.replace(/\s+/g, '');
          const poi =
            candidates.find((candidate) => candidate.name.replace(/\s+/g, '') === normalizedName) ??
            candidates[0] ??
            null;
          return { entry, poi };
        }),
      );
      for (const { entry, poi } of matches) {
        if (!poi?.verified || poi.latitude == null || poi.longitude == null) continue;
        await this.prisma.$executeRaw(Prisma.sql`
          UPDATE "BuiltInPoiEntry"
          SET "poiId" = ${poi.poiId}::uuid, updated_at = NOW()
          WHERE id = ${entry.id}::uuid
        `);
      }
    }

    const rows = await this.prisma.$queryRaw<Array<PoiRow & { built_in_rank: number }>>(Prisma.sql`
      SELECT poi.id AS poi_id,
             poi.amap_id,
             poi.name AS poi_name,
             poi.address AS poi_address,
             poi.latitude,
             poi.longitude,
             poi.verified,
             poi.quality_grade,
             ${`built_in:${BUILT_IN_POI_DATA_VERSION}`} AS source_attribution,
             poi.open_hours_json,
             membership.l1_area_id,
             membership.l2_group_id,
             entry.rank AS built_in_rank
      FROM "BuiltInPoiEntry" entry
      JOIN "CanonicalPOI" poi ON poi.id = entry."poiId"
      LEFT JOIN LATERAL (
        SELECT l1.id AS l1_area_id, membership."l2GroupId" AS l2_group_id
        FROM "PoiMembership" membership
        JOIN "L2Group" l2 ON l2.id = membership."l2GroupId"
        JOIN "L1Area" l1 ON l1.id = l2."l1AreaId"
        WHERE membership."poiId" = poi.id
        ORDER BY membership.priority DESC, membership."l2GroupId"
        LIMIT 1
      ) membership ON TRUE
      WHERE entry."cityId" = ${cityId}::uuid
        AND entry.data_version = ${BUILT_IN_POI_DATA_VERSION}
        AND poi.verified = TRUE
        AND poi.latitude IS NOT NULL
        AND poi.longitude IS NOT NULL
      ORDER BY entry.rank
    `);
    return rows
      .map(
      (row): ResolvedPlannerItem => ({
        itemId: `built-in-${row.poi_id}`,
        inspirationId: null,
        poi: {
          ...mapPoi(row),
          sourceAttribution: `built_in:${BUILT_IN_POI_DATA_VERSION};${row.source_attribution ?? 'amap'}`,
        },
        source: 'built_in',
        timeHint: null,
        stayMinutesHint: null,
        required: false,
      }),
    );
  }
}

export function getPlannerSourceRepository() {
  const prisma = getPrisma();
  return prisma ? new PrismaPlannerSourceRepository(prisma) : null;
}

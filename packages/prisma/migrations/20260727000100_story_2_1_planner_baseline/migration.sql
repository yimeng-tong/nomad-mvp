-- CreateEnum
CREATE TYPE "QualityGrade" AS ENUM ('verified', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "PlannerTimeHint" AS ENUM ('dawn', 'morning', 'afternoon', 'sunset', 'evening', 'night', 'night_market');

-- CreateEnum
CREATE TYPE "SlotOrigin" AS ENUM ('selected_required', 'ai_seed', 'hand', 'hotel', 'free');

-- CreateEnum
CREATE TYPE "PlanJobState" AS ENUM ('queued', 'running', 'done', 'failed');

-- CreateEnum
CREATE TYPE "PlanJobPhase" AS ENUM ('started', 'freeze', 'selected_anchor', 'quota', 'candidates', 'place', 'validate', 'persist', 'done', 'failed');

-- CreateEnum
CREATE TYPE "PlanVersionKind" AS ENUM ('quick', 'hq');

-- CreateEnum
CREATE TYPE "PlanVersionState" AS ENUM ('running', 'ready', 'failed', 'adopted');

-- CreateEnum
CREATE TYPE "HqJobState" AS ENUM ('running', 'done', 'failed');

-- CreateEnum
CREATE TYPE "WarningSeverity" AS ENUM ('soft', 'hard');

-- CreateEnum
CREATE TYPE "UnresolvedReason" AS ENUM ('requires_location', 'hard_time_conflict', 'closed', 'outside_trip', 'unavailable');

-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('uploaded_inspiration', 'reservation', 'ticket');

-- AlterEnum
BEGIN;
CREATE TYPE "PlanPace_new" AS ENUM ('tight', 'comfortable');
ALTER TABLE "UserSettings" ALTER COLUMN "pace_default" DROP DEFAULT;
ALTER TABLE "Plan" ALTER COLUMN "pace" DROP DEFAULT;
ALTER TABLE "UserSettings" ALTER COLUMN "pace_default" TYPE "PlanPace_new"
USING (
  CASE "pace_default"::text
    WHEN 'fast' THEN 'tight'
    ELSE 'comfortable'
  END
)::"PlanPace_new";
ALTER TABLE "Plan" ALTER COLUMN "pace" TYPE "PlanPace_new"
USING (
  CASE "pace"::text
    WHEN 'fast' THEN 'tight'
    ELSE 'comfortable'
  END
)::"PlanPace_new";
ALTER TYPE "PlanPace" RENAME TO "PlanPace_old";
ALTER TYPE "PlanPace_new" RENAME TO "PlanPace";
DROP TYPE "PlanPace_old";
ALTER TABLE "UserSettings" ALTER COLUMN "pace_default" SET DEFAULT 'comfortable';
ALTER TABLE "Plan" ALTER COLUMN "pace" SET DEFAULT 'comfortable';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SlotType" ADD VALUE 'hotel';
ALTER TYPE "SlotType" ADD VALUE 'unresolved';

-- DropIndex
DROP INDEX "PlanDay_planId_day_index_key";

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "pace_default" SET DEFAULT 'comfortable';

-- AlterTable
ALTER TABLE "CanonicalPOI" ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'amap',
ADD COLUMN     "provider_snapshot_json" JSONB,
ADD COLUMN     "quality_grade" "QualityGrade",
ADD COLUMN     "source_attribution" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- Merge legacy rows that represent the same AMap POI before enforcing canonical identity.
CREATE TEMP TABLE "_CanonicalPoiMerge" AS
SELECT duplicate.id AS duplicate_id, winner.id AS winner_id
FROM "CanonicalPOI" duplicate
JOIN LATERAL (
  SELECT candidate.id
  FROM "CanonicalPOI" candidate
  WHERE candidate.amap_id = duplicate.amap_id
  ORDER BY candidate.created_at, candidate.id
  LIMIT 1
) winner ON TRUE
WHERE duplicate.amap_id IS NOT NULL
  AND duplicate.id <> winner.id;

UPDATE "Inspiration" inspiration
SET "poiId" = merge.winner_id
FROM "_CanonicalPoiMerge" merge
WHERE inspiration."poiId" = merge.duplicate_id;

UPDATE "PlanSlot" slot
SET "poiId" = merge.winner_id
FROM "_CanonicalPoiMerge" merge
WHERE slot."poiId" = merge.duplicate_id;

DELETE FROM "CanonicalPOI" poi
USING "_CanonicalPoiMerge" merge
WHERE poi.id = merge.duplicate_id;

DROP TABLE "_CanonicalPoiMerge";

CREATE UNIQUE INDEX "CanonicalPOI_amap_id_key" ON "CanonicalPOI"("amap_id");

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "current_version_id" UUID,
ADD COLUMN     "hotel_change_help_needed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "input_snapshot_json" JSONB,
ADD COLUMN     "luggage_mode" TEXT NOT NULL DEFAULT 'undecided',
ADD COLUMN     "luggage_notes" TEXT,
ADD COLUMN     "request_hash" TEXT,
ADD COLUMN     "seed_undo_expires_at" TIMESTAMP(3),
ADD COLUMN     "seed_undo_token" TEXT,
ADD COLUMN     "smart_planning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wake_preference" TEXT,
ALTER COLUMN "pace" SET DEFAULT 'comfortable';

-- AlterTable
ALTER TABLE "PlanDay" ADD COLUMN     "version_id" UUID;

-- AlterTable
ALTER TABLE "PlanSlot" ADD COLUMN     "candidate_metadata_json" JSONB,
ADD COLUMN     "end_local" VARCHAR(5),
ADD COLUMN     "origin" "SlotOrigin" NOT NULL DEFAULT 'hand',
ADD COLUMN     "start_local" VARCHAR(5),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "SlotCandidate" ADD COLUMN     "inspiration_id" UUID,
ADD COLUMN     "item_id" TEXT,
ADD COLUMN     "metadata_json" JSONB,
ADD COLUMN     "poiId" UUID,
ADD COLUMN     "quality_grade" "QualityGrade",
ADD COLUMN     "source_attribution" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "used_slot_id" UUID,
ADD COLUMN     "version_id" UUID;

-- CreateTable
CREATE TABLE "L1Area" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "centroid_latitude" DECIMAL(9,6),
    "centroid_longitude" DECIMAL(9,6),
    "seasonality" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L1Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L2Group" (
    "id" UUID NOT NULL,
    "l1AreaId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "centroid_latitude" DECIMAL(9,6),
    "centroid_longitude" DECIMAL(9,6),
    "entry_nodes_json" JSONB,
    "exit_nodes_json" JSONB,
    "rules_json" JSONB,
    "duration_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L2Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoiMembership" (
    "poiId" UUID NOT NULL,
    "l2GroupId" UUID NOT NULL,
    "role" TEXT,
    "proximity" DECIMAL(8,3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "hours_fit_json" JSONB,
    "multi_attach" BOOLEAN NOT NULL DEFAULT false,
    "best_time_of_day" "PlannerTimeHint"[] DEFAULT ARRAY[]::"PlannerTimeHint"[],
    "recommended_duration_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoiMembership_pkey" PRIMARY KEY ("poiId","l2GroupId")
);

-- CreateTable
CREATE TABLE "InspirationEvidence" (
    "id" UUID NOT NULL,
    "inspiration_id" UUID NOT NULL,
    "poiId" UUID,
    "date" DATE,
    "start_local" VARCHAR(5),
    "end_local" VARCHAR(5),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "time_hint" "PlannerTimeHint" NOT NULL,
    "source" "EvidenceSource" NOT NULL,
    "evidence_ref" TEXT NOT NULL,
    "source_attribution" TEXT,
    "quality" "QualityGrade" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspirationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnchorPoolEntry" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "poiId" UUID NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnchorPoolEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "request_hash" TEXT NOT NULL,
    "request_snapshot_json" JSONB NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "state" "PlanJobState" NOT NULL DEFAULT 'queued',
    "phase" "PlanJobPhase" NOT NULL DEFAULT 'started',
    "trace_id" TEXT,
    "placed_count" INTEGER NOT NULL DEFAULT 0,
    "remaining_count" INTEGER NOT NULL DEFAULT 0,
    "quick_version_id" UUID,
    "hq_job_id" UUID,
    "error_code" TEXT,
    "error_message" TEXT,
    "retriable" BOOLEAN,
    "terminal_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanJobEventRecord" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "phase" "PlanJobPhase" NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanJobEventRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "kind" "PlanVersionKind" NOT NULL,
    "state" "PlanVersionState" NOT NULL DEFAULT 'running',
    "payload_json" JSONB NOT NULL,
    "config_snapshot_json" JSONB,
    "result_hash" TEXT,
    "failure_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ready_at" TIMESTAMP(3),
    "adopted_at" TIMESTAMP(3),

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HqJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "base_version_id" UUID NOT NULL,
    "request_hash" TEXT NOT NULL,
    "version_id" UUID,
    "state" "HqJobState" NOT NULL DEFAULT 'running',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "provider" TEXT,
    "trace_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "retriable" BOOLEAN,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HqJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanHotelConstraint" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hotel_name" TEXT,
    "address" TEXT,
    "poiId" UUID,
    "leave_blank" BOOLEAN NOT NULL DEFAULT false,
    "breakfast_included" BOOLEAN NOT NULL DEFAULT false,
    "provider_snapshot_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanHotelConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanHotelSlot" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "constraint_id" UUID,
    "date" DATE NOT NULL,
    "leave_blank" BOOLEAN NOT NULL DEFAULT false,
    "breakfast_included" BOOLEAN NOT NULL DEFAULT false,
    "poiId" UUID,
    "provider_snapshot_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanHotelSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEvidenceConstraint" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "version_id" UUID,
    "item_id" TEXT NOT NULL,
    "inspiration_id" UUID,
    "poiId" UUID,
    "date" DATE,
    "start_local" VARCHAR(5),
    "end_local" VARCHAR(5),
    "timezone" TEXT NOT NULL,
    "time_hint" "PlannerTimeHint" NOT NULL,
    "source" "EvidenceSource" NOT NULL,
    "evidence_ref" TEXT NOT NULL,
    "source_attribution" TEXT,
    "quality" "QualityGrade" NOT NULL,
    "slot_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanEvidenceConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanWarning" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "version_id" UUID,
    "slot_id" UUID,
    "item_id" TEXT,
    "code" TEXT NOT NULL,
    "severity" "WarningSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnresolvedRequiredItem" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "version_id" UUID,
    "item_id" TEXT NOT NULL,
    "inspiration_id" UUID,
    "poiId" UUID,
    "reason_code" "UnresolvedReason" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "UnresolvedRequiredItem_pkey" PRIMARY KEY ("id")
);

-- Merge legacy duplicate city partitions before enforcing the city identity key.
CREATE TEMP TABLE "_CityMerge" AS
SELECT duplicate.id AS duplicate_id, winner.id AS winner_id
FROM "City" duplicate
JOIN LATERAL (
  SELECT candidate.id
  FROM "City" candidate
  WHERE candidate.name = duplicate.name
  ORDER BY candidate.id
  LIMIT 1
) winner ON TRUE
WHERE duplicate.id <> winner.id;

UPDATE "CanonicalPOI" value SET "cityId" = merge.winner_id
FROM "_CityMerge" merge WHERE value."cityId" = merge.duplicate_id;
UPDATE "Inspiration" value SET "cityId" = merge.winner_id
FROM "_CityMerge" merge WHERE value."cityId" = merge.duplicate_id;
UPDATE "Plan" value SET "cityId" = merge.winner_id
FROM "_CityMerge" merge WHERE value."cityId" = merge.duplicate_id;
UPDATE "L1Area" value SET "cityId" = merge.winner_id
FROM "_CityMerge" merge WHERE value."cityId" = merge.duplicate_id;
UPDATE "AnchorPoolEntry" value SET "cityId" = merge.winner_id
FROM "_CityMerge" merge WHERE value."cityId" = merge.duplicate_id;
DELETE FROM "City" value USING "_CityMerge" merge WHERE value.id = merge.duplicate_id;
DROP TABLE "_CityMerge";

CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "L1Area_cityId_idx" ON "L1Area"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "L1Area_cityId_name_key" ON "L1Area"("cityId", "name");

-- CreateIndex
CREATE INDEX "L2Group_l1AreaId_idx" ON "L2Group"("l1AreaId");

-- CreateIndex
CREATE UNIQUE INDEX "L2Group_l1AreaId_name_key" ON "L2Group"("l1AreaId", "name");

-- CreateIndex
CREATE INDEX "PoiMembership_l2GroupId_role_idx" ON "PoiMembership"("l2GroupId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "InspirationEvidence_evidence_ref_key" ON "InspirationEvidence"("evidence_ref");

-- CreateIndex
CREATE INDEX "InspirationEvidence_inspiration_id_time_hint_idx" ON "InspirationEvidence"("inspiration_id", "time_hint");

-- CreateIndex
CREATE INDEX "AnchorPoolEntry_cityId_active_expires_at_rank_idx" ON "AnchorPoolEntry"("cityId", "active", "expires_at", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "AnchorPoolEntry_cityId_poiId_key" ON "AnchorPoolEntry"("cityId", "poiId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanJob_planId_key" ON "PlanJob"("planId");

-- CreateIndex
CREATE INDEX "PlanJob_state_updated_at_idx" ON "PlanJob"("state", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "PlanJob_userId_request_hash_key" ON "PlanJob"("userId", "request_hash");

-- CreateIndex
CREATE INDEX "PlanJobEventRecord_job_id_created_at_idx" ON "PlanJobEventRecord"("job_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PlanJobEventRecord_job_id_sequence_key" ON "PlanJobEventRecord"("job_id", "sequence");

-- CreateIndex
CREATE INDEX "PlanVersion_planId_kind_state_idx" ON "PlanVersion"("planId", "kind", "state");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_planId_version_number_key" ON "PlanVersion"("planId", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "HqJob_version_id_key" ON "HqJob"("version_id");

-- CreateIndex
CREATE INDEX "HqJob_planId_state_idx" ON "HqJob"("planId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "HqJob_userId_request_hash_key" ON "HqJob"("userId", "request_hash");

-- CreateIndex
CREATE UNIQUE INDEX "PlanHotelConstraint_planId_date_key" ON "PlanHotelConstraint"("planId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlanHotelSlot_dayId_key" ON "PlanHotelSlot"("dayId");

-- CreateIndex
CREATE INDEX "PlanHotelSlot_constraint_id_idx" ON "PlanHotelSlot"("constraint_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlanHotelSlot_versionId_date_key" ON "PlanHotelSlot"("versionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlanEvidenceConstraint_slot_id_key" ON "PlanEvidenceConstraint"("slot_id");

-- CreateIndex
CREATE INDEX "PlanEvidenceConstraint_planId_version_id_idx" ON "PlanEvidenceConstraint"("planId", "version_id");

-- CreateIndex
CREATE INDEX "PlanEvidenceConstraint_item_id_idx" ON "PlanEvidenceConstraint"("item_id");

-- CreateIndex
CREATE INDEX "PlanWarning_planId_version_id_idx" ON "PlanWarning"("planId", "version_id");

-- CreateIndex
CREATE INDEX "PlanWarning_slot_id_idx" ON "PlanWarning"("slot_id");

-- CreateIndex
CREATE INDEX "UnresolvedRequiredItem_planId_version_id_idx" ON "UnresolvedRequiredItem"("planId", "version_id");

-- CreateIndex
CREATE INDEX "UnresolvedRequiredItem_item_id_idx" ON "UnresolvedRequiredItem"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_userId_request_hash_key" ON "Plan"("userId", "request_hash");

-- CreateIndex
CREATE INDEX "PlanDay_version_id_idx" ON "PlanDay"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_planId_version_id_day_index_key" ON "PlanDay"("planId", "version_id", "day_index");

-- CreateIndex
CREATE INDEX "SlotCandidate_planId_version_id_status_idx" ON "SlotCandidate"("planId", "version_id", "status");

-- CreateIndex
CREATE INDEX "SlotCandidate_poiId_idx" ON "SlotCandidate"("poiId");

-- AddForeignKey
ALTER TABLE "L1Area" ADD CONSTRAINT "L1Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L2Group" ADD CONSTRAINT "L2Group_l1AreaId_fkey" FOREIGN KEY ("l1AreaId") REFERENCES "L1Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiMembership" ADD CONSTRAINT "PoiMembership_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiMembership" ADD CONSTRAINT "PoiMembership_l2GroupId_fkey" FOREIGN KEY ("l2GroupId") REFERENCES "L2Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationEvidence" ADD CONSTRAINT "InspirationEvidence_inspiration_id_fkey" FOREIGN KEY ("inspiration_id") REFERENCES "Inspiration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationEvidence" ADD CONSTRAINT "InspirationEvidence_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnchorPoolEntry" ADD CONSTRAINT "AnchorPoolEntry_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnchorPoolEntry" ADD CONSTRAINT "AnchorPoolEntry_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanJob" ADD CONSTRAINT "PlanJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanJob" ADD CONSTRAINT "PlanJob_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanJob" ADD CONSTRAINT "PlanJob_quick_version_id_fkey" FOREIGN KEY ("quick_version_id") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanJob" ADD CONSTRAINT "PlanJob_hq_job_id_fkey" FOREIGN KEY ("hq_job_id") REFERENCES "HqJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanJobEventRecord" ADD CONSTRAINT "PlanJobEventRecord_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "PlanJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HqJob" ADD CONSTRAINT "HqJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HqJob" ADD CONSTRAINT "HqJob_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HqJob" ADD CONSTRAINT "HqJob_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelConstraint" ADD CONSTRAINT "PlanHotelConstraint_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelConstraint" ADD CONSTRAINT "PlanHotelConstraint_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelSlot" ADD CONSTRAINT "PlanHotelSlot_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PlanDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelSlot" ADD CONSTRAINT "PlanHotelSlot_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelSlot" ADD CONSTRAINT "PlanHotelSlot_constraint_id_fkey" FOREIGN KEY ("constraint_id") REFERENCES "PlanHotelConstraint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHotelSlot" ADD CONSTRAINT "PlanHotelSlot_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvidenceConstraint" ADD CONSTRAINT "PlanEvidenceConstraint_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvidenceConstraint" ADD CONSTRAINT "PlanEvidenceConstraint_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvidenceConstraint" ADD CONSTRAINT "PlanEvidenceConstraint_inspiration_id_fkey" FOREIGN KEY ("inspiration_id") REFERENCES "Inspiration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvidenceConstraint" ADD CONSTRAINT "PlanEvidenceConstraint_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvidenceConstraint" ADD CONSTRAINT "PlanEvidenceConstraint_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "PlanSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWarning" ADD CONSTRAINT "PlanWarning_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWarning" ADD CONSTRAINT "PlanWarning_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWarning" ADD CONSTRAINT "PlanWarning_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "PlanSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnresolvedRequiredItem" ADD CONSTRAINT "UnresolvedRequiredItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnresolvedRequiredItem" ADD CONSTRAINT "UnresolvedRequiredItem_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnresolvedRequiredItem" ADD CONSTRAINT "UnresolvedRequiredItem_inspiration_id_fkey" FOREIGN KEY ("inspiration_id") REFERENCES "Inspiration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnresolvedRequiredItem" ADD CONSTRAINT "UnresolvedRequiredItem_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotCandidate" ADD CONSTRAINT "SlotCandidate_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotCandidate" ADD CONSTRAINT "SlotCandidate_inspiration_id_fkey" FOREIGN KEY ("inspiration_id") REFERENCES "Inspiration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotCandidate" ADD CONSTRAINT "SlotCandidate_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotCandidate" ADD CONSTRAINT "SlotCandidate_used_slot_id_fkey" FOREIGN KEY ("used_slot_id") REFERENCES "PlanSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Versioned, provider-verified built-in fallback manifest.
CREATE TABLE "BuiltInPoiEntry" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "data_version" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "poiId" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuiltInPoiEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BuiltInPoiEntry_cityId_data_version_rank_key"
ON "BuiltInPoiEntry"("cityId", "data_version", "rank");

CREATE UNIQUE INDEX "BuiltInPoiEntry_cityId_data_version_name_key"
ON "BuiltInPoiEntry"("cityId", "data_version", "name");

CREATE INDEX "BuiltInPoiEntry_cityId_data_version_poiId_idx"
ON "BuiltInPoiEntry"("cityId", "data_version", "poiId");

ALTER TABLE "BuiltInPoiEntry"
ADD CONSTRAINT "BuiltInPoiEntry_cityId_fkey"
FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuiltInPoiEntry"
ADD CONSTRAINT "BuiltInPoiEntry_poiId_fkey"
FOREIGN KEY ("poiId") REFERENCES "CanonicalPOI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EditEvent"
  ADD COLUMN "operation_id" TEXT,
  ADD COLUMN "request_hash" TEXT,
  ADD COLUMN "api_slot_id" TEXT,
  ADD COLUMN "day_index" INTEGER,
  ADD COLUMN "base_version_id" UUID,
  ADD COLUMN "result_version_id" UUID,
  ADD COLUMN "result_plan_rev" INTEGER,
  ADD COLUMN "undo_token_hash" TEXT,
  ADD COLUMN "undo_expires_at" TIMESTAMP(3),
  ADD COLUMN "target_event_id" UUID,
  ADD COLUMN "undone_by_event_id" UUID;

CREATE UNIQUE INDEX "EditEvent_planId_operation_id_key"
  ON "EditEvent"("planId", "operation_id");

CREATE INDEX "EditEvent_planId_created_at_idx"
  ON "EditEvent"("planId", "created_at");

CREATE INDEX "EditEvent_planId_result_plan_rev_idx"
  ON "EditEvent"("planId", "result_plan_rev");

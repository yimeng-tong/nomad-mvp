-- Additive auth authority migration. Existing owners/identities remain unverified;
-- no phone matching, owner reassignment, session credential import or data deletion.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- DropIndex
DROP INDEX "OAuthIdentity_provider_subject_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auth_state" TEXT NOT NULL DEFAULT 'legacy-unverified',
ADD COLUMN     "auth_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OAuthIdentity" ADD COLUMN     "client_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "issuer" TEXT NOT NULL DEFAULT 'legacy-unverified',
ADD COLUMN     "tenant" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "auth_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "credential_hash" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "browser_binding_hash" TEXT,
ADD COLUMN     "browser_generation" INTEGER,
ADD COLUMN     "transport" TEXT NOT NULL DEFAULT 'web',
ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'web';

CREATE TABLE "AuthBrowser" (
    "binding_hash" TEXT PRIMARY KEY,
    "login_generation" INTEGER NOT NULL DEFAULT 0,
    "session_generation" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuthLoginTransaction" (
    "transport" TEXT NOT NULL DEFAULT 'web',
    "audience" TEXT NOT NULL DEFAULT 'web',
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "browser_binding_hash" TEXT NOT NULL,
    "browser_generation" INTEGER NOT NULL DEFAULT 0,
    "initial_session_hash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL DEFAULT 'reserved',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verification_generation" INTEGER NOT NULL DEFAULT 0,
    "verification_lease_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "next_allowed_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLoginTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCaptchaUse" (
    "proof_hash" TEXT NOT NULL,
    "request_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCaptchaUse_pkey" PRIMARY KEY ("proof_hash")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "bucket" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("bucket")
);

-- CreateTable
CREATE TABLE "AuthLegacyOwnerBinding" (
    "legacy_actor" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "evidence_reference" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLegacyOwnerBinding_pkey" PRIMARY KEY ("legacy_actor")
);

-- CreateTable
CREATE TABLE "AuthOperatorGrant" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "capability" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "revoked_at" TIMESTAMP(3),
    "granted_by" TEXT NOT NULL,
    "evidence_reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOperatorGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAuditEvent" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "evidence_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthLoginTransaction_phone_next_allowed_at_idx" ON "AuthLoginTransaction"("phone", "next_allowed_at");

-- CreateIndex
CREATE INDEX "AuthLoginTransaction_expires_at_idx" ON "AuthLoginTransaction"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "AuthLoginTransaction_request_key" ON "AuthLoginTransaction"("browser_binding_hash", "request_id");

-- CreateIndex
CREATE INDEX "AuthCaptchaUse_expires_at_idx" ON "AuthCaptchaUse"("expires_at");

-- CreateIndex
CREATE INDEX "AuthRateLimit_expires_at_idx" ON "AuthRateLimit"("expires_at");

-- CreateIndex
CREATE INDEX "AuthLegacyOwnerBinding_user_id_idx" ON "AuthLegacyOwnerBinding"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuthOperatorGrant_user_id_capability_scope_key" ON "AuthOperatorGrant"("user_id", "capability", "scope");

-- CreateIndex
CREATE INDEX "AuthAuditEvent_user_id_created_at_idx" ON "AuthAuditEvent"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthIdentity_trusted_namespace_key" ON "OAuthIdentity"("provider", "issuer", "tenant", "client_id", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Session_credential_hash_key" ON "Session"("credential_hash");

-- CreateIndex
CREATE INDEX "Session_userId_expires_at_idx" ON "Session"("userId", "expires_at");

-- AddForeignKey
ALTER TABLE "AuthLegacyOwnerBinding" ADD CONSTRAINT "AuthLegacyOwnerBinding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthOperatorGrant" ADD CONSTRAINT "AuthOperatorGrant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_browser_binding_hash_fkey" FOREIGN KEY (browser_binding_hash) REFERENCES "AuthBrowser"(binding_hash) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuthLoginTransaction" ADD CONSTRAINT "AuthLoginTransaction_browser_binding_hash_fkey" FOREIGN KEY (browser_binding_hash) REFERENCES "AuthBrowser"(binding_hash) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_auth_state_check"
  CHECK (auth_state IN ('legacy-unverified', 'active', 'disabled', 'deleting', 'deleted')),
  ADD CONSTRAINT "User_auth_version_check" CHECK (auth_version >= 0);
ALTER TABLE "Session" ADD CONSTRAINT "Session_credential_hash_check"
  CHECK (credential_hash IS NULL OR credential_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "Session_auth_version_check" CHECK (auth_version >= 0);
ALTER TABLE "AuthLoginTransaction" ADD CONSTRAINT "AuthLoginTransaction_state_check"
  CHECK (delivery_state IN ('reserved', 'sent', 'unknown', 'failed')),
  ADD CONSTRAINT "AuthLoginTransaction_attempts_check" CHECK (attempts BETWEEN 0 AND 5),
  ADD CONSTRAINT "AuthLoginTransaction_generation_check" CHECK (verification_generation >= 0),
  ADD CONSTRAINT "AuthLoginTransaction_binding_check" CHECK (browser_binding_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "AuthLoginTransaction_context_check" CHECK (initial_session_hash ~ '^[0-9a-f]{64}$');
ALTER TABLE "AuthLegacyOwnerBinding" ADD CONSTRAINT "AuthLegacyOwnerBinding_evidence_check"
  CHECK (length(trim(evidence_reference)) > 0 AND length(trim(approved_by)) > 0);
ALTER TABLE "AuthOperatorGrant" ADD CONSTRAINT "AuthOperatorGrant_evidence_check"
  CHECK (length(trim(evidence_reference)) > 0 AND length(trim(granted_by)) > 0 AND version > 0);

-- Retained jobs stay unqualified until an explicit trusted migration audit.
ALTER TABLE "IngestJob" ADD COLUMN auth_version INTEGER;
ALTER TABLE "PlanJob" ADD COLUMN auth_version INTEGER;
ALTER TABLE "HqJob" ADD COLUMN auth_version INTEGER;
ALTER TABLE "Session" ADD CONSTRAINT "Session_transport_check" CHECK ((transport='web' AND audience='web') OR (transport='native' AND audience ~ '^https://'));
ALTER TABLE "AuthLoginTransaction" ADD CONSTRAINT "AuthLoginTransaction_transport_check" CHECK ((transport='web' AND audience='web') OR (transport='native' AND audience ~ '^https://'));

COMMIT;

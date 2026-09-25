-- Synthetic legacy records only, in a fresh isolated database before auth migration.
INSERT INTO "User" (id, phone) VALUES ('10000000-0000-4000-8000-000000000001', '+8613800000000');
INSERT INTO "OAuthIdentity" (id, "userId", provider, subject)
VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'legacy-test', 'synthetic-subject');
INSERT INTO "Session" (id, "userId", expires_at)
VALUES ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', now() + interval '1 day');

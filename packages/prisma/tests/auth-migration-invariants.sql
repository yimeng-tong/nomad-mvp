-- Does not authenticate or claim any retained production data.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM "User" WHERE id='10000000-0000-4000-8000-000000000001'
    AND phone='+8613800000000' AND auth_state='legacy-unverified' AND auth_version=0;
  IF n<>1 THEN RAISE EXCEPTION 'Legacy owner was changed or trusted without proof'; END IF;
  SELECT count(*) INTO n FROM "OAuthIdentity" WHERE provider='legacy-test'
    AND issuer='legacy-unverified' AND verified_at IS NULL;
  IF n<>1 THEN RAISE EXCEPTION 'Legacy identity was automatically verified'; END IF;
  SELECT count(*) INTO n FROM "Session" WHERE id='30000000-0000-4000-8000-000000000001'
    AND credential_hash IS NULL AND revoked_at IS NULL;
  IF n<>1 THEN RAISE EXCEPTION 'Legacy session was lost or became an authentication credential'; END IF;

  -- Public references never function as valid stored secrets.
  BEGIN
    UPDATE "Session" SET credential_hash=id::text WHERE id='30000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Public session ID was accepted as a credential hash';
  EXCEPTION WHEN check_violation THEN NULL; END;

  INSERT INTO "User" (id, auth_state) VALUES ('10000000-0000-4000-8000-000000000002', 'active');
  INSERT INTO "OAuthIdentity" (id,"userId",provider,issuer,tenant,client_id,subject,verified_at)
  VALUES ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','legacy-test','https://issuer.example','tenant-a','client-a','synthetic-subject',now());
  -- Same textual subject in a different trusted namespace is not automatically merged.
  INSERT INTO "OAuthIdentity" (id,"userId",provider,issuer,tenant,client_id,subject,verified_at)
  VALUES ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','legacy-test','https://issuer.example','tenant-b','client-a','synthetic-subject',now());
  BEGIN
    INSERT INTO "OAuthIdentity" (id,"userId",provider,issuer,tenant,client_id,subject,verified_at)
    VALUES ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','legacy-test','https://issuer.example','tenant-a','client-a','synthetic-subject',now());
    RAISE EXCEPTION 'Duplicate trusted identity accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;

  INSERT INTO "Session" (id,"userId",credential_hash,expires_at) VALUES
    ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',repeat('a',64),now()+interval '1 day'),
    ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002',repeat('b',64),now()+interval '1 day');
  UPDATE "Session" SET revoked_at=now() WHERE id='30000000-0000-4000-8000-000000000002';
  SELECT count(*) INTO n FROM "Session" WHERE "userId"='10000000-0000-4000-8000-000000000002' AND revoked_at IS NULL;
  IF n<>1 THEN RAISE EXCEPTION 'Revoking one device removed the other'; END IF;

  BEGIN
    INSERT INTO "AuthLegacyOwnerBinding" (legacy_actor,user_id,evidence_reference,approved_by)
    VALUES ('synthetic-old-actor','10000000-0000-4000-8000-000000000001','','');
    RAISE EXCEPTION 'Legacy binding accepted without evidence';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE "User" SET auth_state='unexpected' WHERE id='10000000-0000-4000-8000-000000000002';
    RAISE EXCEPTION 'Unknown account qualification accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT 'auth-migration-invariants-passed' AS result;

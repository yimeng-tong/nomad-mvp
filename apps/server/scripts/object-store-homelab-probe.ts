/** Run only on VM104 with server-side NOMAD_OBJECT_* variables and synthetic bytes. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getMediaBytes, putMediaBytes } from '../src/ingest/object-store.js';

const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const ownerId = randomUUID(), jobId = randomUUID();
const checks: Record<string, boolean> = {};
let key: string | undefined;
try {
  const stored = await putMediaBytes({ ownerId, jobId, bytes, contentType: 'image/png' });
  key = stored.cosKey;
  checks.owner_scoped_key = key.startsWith(`owners/${ownerId}/ingest/${jobId}/`);
  checks.actual_byte_digest = stored.sha256 === createHash('sha256').update(bytes).digest('hex');
  const fetched = await getMediaBytes(key);
  checks.signed_get_exact_bytes = fetched.bytes.equals(bytes);
  checks.content_type = fetched.contentType === 'image/png';
  assert.ok(Object.values(checks).every(Boolean));
} finally {
  if (key) {
    const s3 = new S3Client({ endpoint: process.env.NOMAD_OBJECT_ENDPOINT,
      region: 'us-east-1', forcePathStyle: true, maxAttempts: 2,
      credentials: { accessKeyId: process.env.NOMAD_OBJECT_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NOMAD_OBJECT_SECRET_ACCESS_KEY! } });
    try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.NOMAD_OBJECT_BUCKET!, Key: key })); }
    finally { s3.destroy(); }
  }
}
process.stdout.write(`${JSON.stringify({ kind: 'nomad-story18-object-adapter-homelab-probe',
  checks, passed: Object.values(checks).every(Boolean), syntheticOnly: true,
  objectDeletedAfterProbe: true, secretsEmitted: false })}\n`);

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AuthFault } from '../src/auth/errors.js';
import { getMediaBytes, putMediaBytes } from '../src/ingest/object-store.js';

assert.equal(hostname(), 'nomad-staging');
assert.equal(process.env.NOMAD_OBJECT_PROBE_ACK, 'synthetic-only');
assert.equal(process.env.NOMAD_OBJECT_ENDPOINT, 'https://objects.yinianyunqi.top:8333');
assert.equal(process.env.NOMAD_OBJECT_BUCKET, 'nomad-development');

const bytes = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082', 'hex');
const result = await putMediaBytes({ ownerId: randomUUID(), jobId: randomUUID(),
  bytes, contentType: 'image/png' });
const s3 = new S3Client({ endpoint: process.env.NOMAD_OBJECT_ENDPOINT, region: 'us-east-1',
  forcePathStyle: true, maxAttempts: 2, credentials: {
    accessKeyId: process.env.NOMAD_OBJECT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NOMAD_OBJECT_SECRET_ACCESS_KEY!,
  } });
let positiveExactBytes = false;
let alteredSameLengthRejected = false;
try {
  const read = await getMediaBytes(result.cosKey);
  positiveExactBytes = read.bytes.equals(bytes) && read.contentType === 'image/png';
  assert.equal(positiveExactBytes, true);
  const changed = Buffer.from(bytes);
  changed[changed.length - 1] ^= 1;
  await s3.send(new PutObjectCommand({ Bucket: process.env.NOMAD_OBJECT_BUCKET,
    Key: result.cosKey, Body: changed, ContentType: 'image/png' }));
  try { await getMediaBytes(result.cosKey); }
  catch (error) {
    alteredSameLengthRejected = error instanceof AuthFault && error.code === 'MEDIA_OBJECT_UNAVAILABLE';
  }
  assert.equal(alteredSameLengthRejected, true);
} finally {
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.NOMAD_OBJECT_BUCKET,
    Key: result.cosKey }));
  s3.destroy();
}
console.log(JSON.stringify({ kind: 'nomad-object-store-integrity-synthetic-probe',
  positiveExactBytes, alteredSameLengthRejected, syntheticObjectRemoved: true,
  secretValuesEmitted: false }));

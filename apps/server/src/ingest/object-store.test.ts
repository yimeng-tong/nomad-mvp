import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { AuthFault } from '../auth/errors.js';
import { putMediaBytes } from './object-store.js';

const keys = ['NOMAD_OBJECT_ENDPOINT', 'NOMAD_OBJECT_BUCKET',
  'NOMAD_OBJECT_ACCESS_KEY_ID', 'NOMAD_OBJECT_SECRET_ACCESS_KEY'] as const;
const validInput = () => ({ ownerId: randomUUID(), jobId: randomUUID(),
  bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]), contentType: 'image/png' });
const fault = (code: string) => (error: unknown) => error instanceof AuthFault && error.code === code;

test('media bytes fail closed without a server-side object credential', async () => {
  const saved = keys.map((key) => process.env[key]);
  try {
    for (const key of keys) delete process.env[key];
    await assert.rejects(putMediaBytes(validInput()), fault('MEDIA_OBJECT_UNAVAILABLE'));
  } finally { keys.forEach((key, index) => { if (saved[index] === undefined) delete process.env[key];
    else process.env[key] = saved[index]; }); }
});

test('plaintext endpoint is rejected before contacting a storage service', async () => {
  const saved = keys.map((key) => process.env[key]);
  try {
    process.env.NOMAD_OBJECT_ENDPOINT = 'http://127.0.0.1:8333';
    process.env.NOMAD_OBJECT_BUCKET = 'nomad-development';
    process.env.NOMAD_OBJECT_ACCESS_KEY_ID = 'synthetic-access-id';
    process.env.NOMAD_OBJECT_SECRET_ACCESS_KEY = 'synthetic-secret-material-for-only-this-test';
    await assert.rejects(putMediaBytes(validInput()), fault('MEDIA_OBJECT_UNAVAILABLE'));
  } finally { keys.forEach((key, index) => { if (saved[index] === undefined) delete process.env[key];
    else process.env[key] = saved[index]; }); }
});

test('untrusted media type, owner identity and oversized bytes are rejected', async () => {
  await assert.rejects(putMediaBytes({ ...validInput(), contentType: 'text/html' }), fault('MEDIA_OBJECT_INVALID'));
  await assert.rejects(putMediaBytes({ ...validInput(), ownerId: 'someone-else' }), fault('MEDIA_OBJECT_INVALID'));
  await assert.rejects(putMediaBytes({ ...validInput(), bytes: Buffer.alloc(32 * 1024 * 1024 + 1) }),
    fault('MEDIA_OBJECT_INVALID'));
});

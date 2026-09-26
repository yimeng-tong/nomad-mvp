import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import Fastify from 'fastify';
import authPlugin from '../plugins/auth.js';
import errorEnvelope from '../plugins/error-envelope.js';
import libraryRoutes from '../routes/library.js';

await test('import record reads require an owner and expose neutral missing responses without starting work', async () => {
  process.env.AUTH_RUNTIME_MODE = 'test';
  process.env.AUTH_PROVIDER = 'fixture';
  process.env.AUTH_TEST_ADAPTER_ENABLED = 'true';
  delete process.env.DATABASE_URL;
  const app = Fastify({ logger: false });
  await app.register(errorEnvelope);
  await app.register(authPlugin);
  await app.register(libraryRoutes);
  try {
    const anonymous = await app.inject({ method: 'GET', url: '/library/import-records' });
    assert.equal(anonymous.statusCode, 401);
    const headers = { 'x-user-id': 'synthetic-import-owner' };
    const empty = await app.inject({ method: 'GET', url: '/library/import-records', headers });
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(empty.json(), { items: [], next_cursor: null });
    const badCursor = await app.inject({ method: 'GET', url: '/library/import-records?cursor=bad', headers });
    assert.equal(badCursor.statusCode, 400);
    assert.equal((badCursor.json() as { error_code?: string }).error_code, 'LIBRARY_CURSOR_INVALID');
    const absent = await app.inject({ method: 'GET', url: `/library/import-records/${randomUUID()}`, headers });
    assert.equal(absent.statusCode, 404);
    assert.equal((absent.json() as { error_code?: string }).error_code, 'LIBRARY_IMPORT_RECORD_NOT_FOUND');
    assert.equal(absent.headers['cache-control'], 'no-store');
    assert.equal((await app.inject({ method: 'DELETE', url: `/library/import-records/${randomUUID()}` })).statusCode, 401);
    const missingDelete = await app.inject({ method: 'DELETE', url: `/library/import-records/${randomUUID()}`, headers });
    assert.equal(missingDelete.statusCode, 404);
    assert.equal((missingDelete.json() as { error_code?: string }).error_code, 'LIBRARY_IMPORT_RECORD_NOT_FOUND');
    assert.equal(missingDelete.headers['cache-control'], 'no-store');
    const malformedDelete = await app.inject({ method: 'DELETE', url: '/library/import-records/not-a-uuid', headers });
    assert.equal(malformedDelete.statusCode, 404);
    assert.equal((malformedDelete.json() as { error_code?: string }).error_code, 'LIBRARY_IMPORT_RECORD_NOT_FOUND');
  } finally { await app.close(); }
});

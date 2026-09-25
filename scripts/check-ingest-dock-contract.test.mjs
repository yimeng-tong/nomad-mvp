import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import yaml from 'js-yaml';
const api = yaml.load(readFileSync(new URL('../docs/api/openapi.yaml', import.meta.url),'utf8'));
test('ingest acknowledgment carries actual disposition and a versioned snapshot', () => {
  const ack = api.components.schemas.IngestStartResponse;
  for (const field of ['disposition','snapshot']) assert.ok(ack.properties[field], field);
  const snapshot = api.components.schemas.IngestSnapshot;
  for (const field of ['attempt','state_version','state','actions','result']) assert.ok(snapshot.properties[field], field);
});
test('status, command recovery and retry are protected, and retry never creates a new job identity', () => {
  for (const [path, verb] of [['/ingest/{job_id}','get'],['/ingest/{job_id}/retry','post'],['/ingest/commands/{operation_id}','get']]) {
    const operation=api.paths[path]?.[verb]; assert.ok(operation, `${verb} ${path}`);
    assert.ok(operation.security.some((item) => item.SessionAuth));
    assert.ok(operation.responses['401']); assert.ok(operation.responses['503']);
  }
  assert.deepEqual(api.components.schemas.IngestRetryRequest.required.sort(), ['expected_attempt','expected_state_version','operation_id'].sort());
});

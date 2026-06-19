import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import traceIdPlugin from '../src/plugins/trace-id.js';
import accountRoutes from '../src/routes/account.js';
import byokRoutes from '../src/routes/byok.js';
import feedbackRoutes from '../src/routes/feedback.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJson(response: { body: string }) {
  return response.body ? (JSON.parse(response.body) as Record<string, any>) : {};
}

const USER_A = '00000000-0000-4000-8000-000000000151';
const queueCalls: Array<{ queue: string; name: string; payload: Record<string, unknown> }> = [];

function authHeaders(userId = USER_A) {
  return {
    'x-user-id': userId,
    'x-device-id': 'settings-probe',
    'x-trace-id': 'trace-settings-probe',
  };
}

async function buildSettingsApp() {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(traceIdPlugin);
  await app.register(errorEnvelope);
  await app.register(authPlugin);
  app.decorate('queues', {
    exportQueue: {
      add: async (name: string, payload: Record<string, unknown>) => {
        queueCalls.push({ queue: 'export', name, payload });
      },
    },
    deleteQueue: {
      add: async (name: string, payload: Record<string, unknown>) => {
        queueCalls.push({ queue: 'delete', name, payload });
      },
    },
  });
  await app.register(byokRoutes);
  await app.register(accountRoutes);
  await app.register(feedbackRoutes);
  await app.ready();
  return app;
}

async function main() {
  const previousProductId = process.env.FEEDBACK_PRODUCT_ID;
  process.env.FEEDBACK_PRODUCT_ID = '12345';
  queueCalls.length = 0;

  const app = await buildSettingsApp();
  try {
    const unauthStatus = await app.inject({ method: 'GET', url: '/user-key' });
    assert(unauthStatus.statusCode === 401, 'BYOK status should require auth');

    const initialStatus = await app.inject({ method: 'GET', url: '/user-key', headers: authHeaders() });
    assert(initialStatus.statusCode === 200, 'BYOK status should succeed');
    assert(parseJson(initialStatus).configured === false, 'initial BYOK status should be unconfigured');

    const invalidValidation = await app.inject({
      method: 'POST',
      url: '/byok/validate',
      headers: authHeaders(),
      payload: { key: 'bad' },
    });
    assert(invalidValidation.statusCode === 200, 'BYOK validation should not store invalid keys');
    assert(parseJson(invalidValidation).valid === false, 'short BYOK key should be invalid');

    const invalidSave = await app.inject({
      method: 'POST',
      url: '/user-key',
      headers: authHeaders(),
      payload: { key: 'bad' },
    });
    assert(invalidSave.statusCode === 400, 'saving invalid BYOK key should fail');
    assert(!invalidSave.body.includes('bad'), 'invalid BYOK response should not echo plaintext key');

    const save = await app.inject({
      method: 'POST',
      url: '/user-key',
      headers: authHeaders(),
      payload: { key: 'sk-valid-secret-value' },
    });
    assert(save.statusCode === 200, 'saving valid BYOK key should succeed');
    const saveBody = parseJson(save);
    assert(saveBody.configured === true, 'saving valid BYOK key should return configured status');
    assert(saveBody.key_ref && saveBody.key_ref !== 'sk-valid-secret-value', 'BYOK response should return key reference only');
    assert(!save.body.includes('sk-valid-secret-value'), 'BYOK save should not echo plaintext key');

    const aliasSave = await app.inject({
      method: 'POST',
      url: '/byok/save',
      headers: authHeaders(),
      payload: { key: 'sk-valid-secret-value-2' },
    });
    assert(aliasSave.statusCode === 200, 'BYOK save alias should succeed');

    const configuredStatus = await app.inject({ method: 'GET', url: '/user-key', headers: authHeaders() });
    assert(parseJson(configuredStatus).configured === true, 'BYOK status should reflect saved key');

    const deletion = await app.inject({ method: 'DELETE', url: '/user-key', headers: authHeaders() });
    assert(deletion.statusCode === 204, 'BYOK delete should return 204');

    const exportTask = await app.inject({ method: 'POST', url: '/account/export', headers: authHeaders() });
    assert(exportTask.statusCode === 200, 'account export should queue');
    assert(parseJson(exportTask).status === 'queued', 'account export should report queued status');
    assert(queueCalls.some((call) => call.queue === 'export' && call.payload.user_id === USER_A), 'export queue should receive current user id');

    const deleteTask = await app.inject({ method: 'DELETE', url: '/account', headers: authHeaders() });
    assert(deleteTask.statusCode === 200, 'account deletion should queue');
    assert(parseJson(deleteTask).status === 'queued', 'account deletion should report queued status');
    assert(queueCalls.some((call) => call.queue === 'delete' && call.payload.user_id === USER_A), 'delete queue should receive current user id');

    const feedback = await app.inject({ method: 'GET', url: '/feedback/link?source=settings', headers: authHeaders() });
    assert(feedback.statusCode === 200, 'feedback link should succeed');
    const feedbackUrl = parseJson(feedback).url as string;
    assert(feedbackUrl.startsWith('https://support.qq.com/product/12345'), 'feedback URL should use singular product path');
    assert(feedbackUrl.includes('source=settings'), 'feedback URL should include safe source context');
    assert(!feedbackUrl.includes(USER_A), 'feedback URL should not include raw user id');
  } finally {
    await app.close();
    if (previousProductId === undefined) {
      delete process.env.FEEDBACK_PRODUCT_ID;
    } else {
      process.env.FEEDBACK_PRODUCT_ID = previousProductId;
    }
  }

  console.log('settings contract probe ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

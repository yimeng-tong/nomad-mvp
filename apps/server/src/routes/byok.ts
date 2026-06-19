import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { generateDek, type SealedPayload, sealWithDek, type WrappedDEK, wrapDek } from '../crypto/kms.js';
import { authGuard } from '../plugins/auth.js';

const ByokValidateBody = z.object({
  key: z.string().min(1),
});
const ByokSaveBody = z.object({
  provider: z
    .enum(['openai'])
    .nullable()
    .optional()
    .transform((value) => value ?? 'openai'),
  key: z.string().min(8).regex(/^\S+$/),
});
type StoredByokKey = {
  provider: 'openai';
  keyRef: string;
  wrappedDek: WrappedDEK;
  sealedKey: SealedPayload;
  updatedAt: string;
};
const keyStatusByUser = new Map<string, StoredByokKey>();

function isValidByokKey(key: string) {
  return key.trim().length >= 8 && !/\s/.test(key);
}

function statusFor(userId: string) {
  const status = keyStatusByUser.get(userId);
  return {
    configured: Boolean(status),
    provider: status?.provider ?? null,
    key_ref: status?.keyRef ?? null,
  };
}

function sealKey(key: string) {
  const dek = generateDek();
  return {
    keyRef: `byok_${randomUUID()}`,
    wrappedDek: wrapDek(dek),
    sealedKey: sealWithDek(dek, Buffer.from(key)),
  };
}

async function saveByok(req: any, reply: any) {
  const parsed = ByokSaveBody.safeParse(req.body);
  if (!parsed.success) return reply.sendError('BYOK_PARAMS_INVALID', 'invalid byok body', 400, false, { issues: parsed.error.issues });
  if (!isValidByokKey(parsed.data.key)) {
    return reply.sendError('BYOK_KEY_INVALID', 'invalid byok key', 400, false);
  }
  const sealed = sealKey(parsed.data.key);
  keyStatusByUser.set(req.user!.id, {
    provider: parsed.data.provider,
    keyRef: sealed.keyRef,
    wrappedDek: sealed.wrappedDek,
    sealedKey: sealed.sealedKey,
    updatedAt: new Date().toISOString(),
  });
  return reply.send(statusFor(req.user!.id));
}

async function deleteByok(req: any, reply: any) {
  keyStatusByUser.delete(req.user!.id);
  return reply.code(204).send();
}

export default fp(async (app) => {
  app.get('/user-key', { preHandler: authGuard }, async (req: any) => {
    return statusFor(req.user!.id);
  });

  app.post('/byok/validate', { preHandler: authGuard }, async (req: any, reply: any) => {
    const parsed = ByokValidateBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('BYOK_PARAMS_INVALID', 'invalid byok body', 400, false, { issues: parsed.error.issues });
    return {
      valid: isValidByokKey(parsed.data.key),
      provider: isValidByokKey(parsed.data.key) ? 'openai' : null,
    };
  });

  app.post('/user-key', { preHandler: authGuard }, saveByok);
  app.post('/byok/save', { preHandler: authGuard }, saveByok);
  app.post('/byok/set', { preHandler: authGuard }, saveByok);
  app.delete('/user-key', { preHandler: authGuard }, deleteByok);
  app.delete('/byok', { preHandler: authGuard }, deleteByok);
});

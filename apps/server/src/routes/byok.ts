import fp from 'fastify-plugin';
import { z } from 'zod';
import { generateDek, sealWithDek, wrapDek } from '../crypto/kms.js';
import { authGuard } from '../plugins/auth.js';

const ByokSetBody = z.object({ provider: z.string().default('openai'), key: z.string().min(8) });

export default fp(async (app) => {
  app.post('/byok/set', { preHandler: authGuard }, async (req: any, reply) => {
    const parsed = ByokSetBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    const dek = generateDek();
    const sealed = sealWithDek(dek, Buffer.from(parsed.data.key));
    const wrapped = wrapDek(dek);
    // TODO: persist { user_id, provider, wrapped_dek, sealed_payload }
    return reply.send({ ok: true, provider: parsed.data.provider, key_ref: wrapped.keyId });
  });

  app.delete('/byok', { preHandler: authGuard }, async (req: any) => {
    // TODO: delete stored key material
    return { ok: true };
  });
});



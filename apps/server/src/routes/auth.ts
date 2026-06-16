import fp from 'fastify-plugin';
import { z } from 'zod';
import { authGuard } from '../plugins/auth.js';

const OtpStartBody = z.object({ phone: z.string().min(6), region: z.string().default('CN') });
const OtpVerifyBody = z.object({ phone: z.string(), otp: z.string().min(4), device_fingerprint: z.string().optional() });

export default fp(async (app) => {
  app.post('/auth/otp/start', async (req: any, reply) => {
    const parsed = OtpStartBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    // rudimentary risk signal: if same IP/device flood, ask captcha next
    const risk = (req as any).risk as { ip: string, device: string };
    const needCaptcha = false; // TODO: integrate Tencent Captcha switch
    return reply.send({ sent: true, retry_after_sec: 60, captcha_required: needCaptcha });
  });

  app.post('/auth/otp/verify', async (req: any, reply) => {
    const parsed = OtpVerifyBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    const sid = `u_${Buffer.from(parsed.data.phone).toString('hex').slice(0, 8)}`;
    reply.setCookie('sid', sid, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
    return reply.send({ user_id: sid });
  });

  app.get('/me', { preHandler: authGuard }, async (req: any) => {
    return { user_id: req.user!.id };
  });

  app.get('/sessions', { preHandler: authGuard }, async (req: any) => {
    return { sessions: [{ id: req.user!.id, device: 'current' }] };
  });

  app.delete('/sessions/:id', { preHandler: authGuard }, async (req: any, reply) => {
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });

  app.post('/logout', { preHandler: authGuard }, async (req: any, reply) => {
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });
});



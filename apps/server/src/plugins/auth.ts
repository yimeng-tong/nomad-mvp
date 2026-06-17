import fp from 'fastify-plugin';
import { getSession, type AuthSession } from '../auth/session-store.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
    authSession?: AuthSession;
  }
}

export async function authGuard(req: any, reply: any) {
  if (!req.user) {
    return reply.sendError('AUTH_SESSION_EXPIRED', 'auth required', 401, false);
  }
}

export default fp(async (app) => {
  app.addHook('onRequest', async (req: any, reply) => {
    const sid = (req.cookies as any)?.sid as string | undefined;
    const uidHeader = Array.isArray(req.headers['x-user-id']) ? undefined : req.headers['x-user-id'] as string | undefined;
    const deviceHeader = Array.isArray(req.headers['x-device-id']) ? undefined : req.headers['x-device-id'] as string | undefined;
    // Simple risk signals for captcha triggering in OTP flows can be added via request context
    (req as any).risk = {
      ip: req.ip,
      device: deviceHeader || 'nodev'
    };
    if (sid) {
      const session = getSession(sid);
      if (session) {
        req.user = { id: session.user_id };
        req.authSession = session;
      }
    } else if (uidHeader) {
      req.user = { id: uidHeader };
    }
  });
});


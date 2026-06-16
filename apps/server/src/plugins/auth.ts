import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
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
    const uidHeader = req.headers['x-user-id'] as string | undefined;
    // Simple risk signals for captcha triggering in OTP flows can be added via request context
    (req as any).risk = {
      ip: req.ip,
      device: (req.headers['x-device-id'] as string) || 'nodev'
    };
    if (sid) {
      req.user = { id: sid };
    } else if (uidHeader) {
      req.user = { id: uidHeader };
    }
  });
});



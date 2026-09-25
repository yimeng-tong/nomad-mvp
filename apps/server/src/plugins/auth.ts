import fp from 'fastify-plugin';
import { getSession, type AuthSession } from '../auth/session-store.js';
import { assertFixtureAuthAllowed } from '../auth/runtime-boundary.js';
import type { PersistentAuthService } from '../auth/service.js';
import type { PersistentSession } from '../auth/prisma-repository.js';
import { AuthFault } from '../auth/errors.js';
import { actorContext } from '../auth/owner.js';
import { validCredential } from '../auth/credentials.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
    authSession?: AuthSession;
    authPrincipal?: PersistentSession;
    authCredential?: string;
    authTransport?: 'web' | 'native';
  }
  interface FastifyInstance {
    authAuthority?: PersistentAuthService;
  }
}

export function singleHeader(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

export type AuthPluginOptions = { service?: PersistentAuthService };

export async function authGuard(req: any, reply: any) {
  if (!req.user) {
    return reply.sendError('AUTH_SESSION_EXPIRED', 'auth required', 401, false);
  }
}

export default fp<AuthPluginOptions>(async (app, options) => {
  if (options.service) {
    const service = options.service;
    app.decorate('authAuthority', service);
    const publicRoutes = new Set(['/health', '/auth/config', '/auth/otp/start', '/auth/otp/verify', '/auth/native/otp/start', '/auth/native/otp/verify', '/logout']);
    app.addHook('onRequest', (req, reply, done) => {
      void (async () => {
        reply.header('Cache-Control', 'no-store');
        if (req.method === 'OPTIONS') return undefined;
        const path = req.routeOptions.url ?? req.url.split('?')[0];
        const unsafe = !['GET', 'HEAD'].includes(req.method);
        const native = path.startsWith('/auth/native/') || req.headers.authorization !== undefined || req.headers['x-nomad-auth-audience'] !== undefined;
        req.authTransport = native ? 'native' : 'web';
        let secret: string | undefined;
        let session: PersistentSession | null | undefined;
        if (native) {
          if (!service.config.nativeEnabled) throw new AuthFault('AUTH_NATIVE_UNAVAILABLE', 503);
          if (req.protocol !== 'https' || req.headers.origin !== undefined || req.headers.cookie !== undefined
            || singleHeader(req.headers['x-nomad-auth-audience']) !== service.config.apiOrigin || path.startsWith('/auth/otp/')) {
            throw new AuthFault('AUTH_CHANNEL_REJECTED', 403);
          }
          const authorization = singleHeader(req.headers.authorization);
          if (req.headers.authorization !== undefined && (!authorization?.startsWith('Bearer ') || !validCredential(authorization.slice(7)))) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
          secret = authorization?.slice(7);
          session = await service.authenticate(secret, true);
        } else {
          if (unsafe && !service.config.allowedOrigins.includes(singleHeader(req.headers.origin) ?? '')) throw new AuthFault('AUTH_ORIGIN_REJECTED', 403);
          const resolved = await service.authenticateCookies(req.cookies);
          session = resolved?.session; secret = resolved?.secret;
        }
        req.authCredential = secret;
        if (session) {
          req.user = { id: session.user_id };
          req.authPrincipal = session;
          req.authSession = { id: session.id, user_id: session.user_id, device_id: session.device_id,
            created_at: session.created_at.toISOString(), expires_at: session.expires_at.toISOString() };
        }
        if (!publicRoutes.has(path) && !session) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
        const query = req.query as Record<string, unknown> | undefined;
        const stream = path.startsWith('/sse/') || path.endsWith('/events');
        const owner = singleHeader(req.headers['x-auth-user-id'])
          ?? (stream && typeof query?.auth_user_id === 'string' ? query.auth_user_id : undefined);
        const publicId = singleHeader(req.headers['x-auth-session-id'])
          ?? (stream && typeof query?.auth_session_id === 'string' ? query.auth_session_id : undefined);
        if (session && !publicRoutes.has(path) && !['/me', '/sessions/me'].includes(path)) {
          service.assertExpected(session, owner, publicId);
        }
        if (unsafe && path !== '/logout') {
          if (session) service.assertExpected(session, owner, publicId);
          else if ((path.startsWith('/auth/otp/') || path.startsWith('/auth/native/otp/')) && (owner !== 'anonymous' || publicId !== 'anonymous')) {
            throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
          }
        }
        return session ? { ownerId: session.user_id, authVersion: session.auth_version, sessionId: session.id } : undefined;
      })().then((actor) => actorContext.run(actor, done), (error: unknown) => {
        const safe = error instanceof AuthFault ? error : new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
        reply.sendError(safe.code, safe.code, safe.status, safe.retriable, safe.details);
      });
    });
    app.addHook('onSend', async (req, reply, payload) => {
      const path = req.routeOptions.url ?? '';
      if (!['GET','HEAD'].includes(req.method) || reply.statusCode < 200 || reply.statusCode >= 300 || !req.authPrincipal
        || publicRoutes.has(path) || path.startsWith('/sse/') || path.endsWith('/events')) return payload;
      try {
        const current = await service.authenticate(req.authCredential, req.authTransport === 'native');
        if (!current || current.id !== req.authPrincipal.id || current.user_id !== req.authPrincipal.user_id) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
        return payload;
      } catch (error) {
        const safe = error instanceof AuthFault ? error : new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
        reply.code(safe.status).header('Content-Type', 'application/json; charset=utf-8').removeHeader('Content-Length');
        return JSON.stringify({ error_code: safe.code, error_message: safe.code, retriable: safe.retriable });
      }
    });
    return;
  }
  assertFixtureAuthAllowed();
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

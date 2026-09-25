import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuthFault } from './errors.js';
import { validCredential } from './credentials.js';
import { operatorCapabilities, validOperatorScope } from './operator.js';
import { type AuthCookieSink, type AuthRequestContext, PersistentAuthService, publicSession, publicUser } from './service.js';
import { authGuard, singleHeader } from '../plugins/auth.js';

const graphic = z.object({ lot_number: z.string().min(1).max(128), captcha_output: z.string().min(1).max(4096),
  pass_token: z.string().min(1).max(1024), gen_time: z.string().min(1).max(32) }).strict();
const start = z.object({ phone: z.string().min(6).max(32), region: z.literal('CN').default('CN'),
  request_id: z.string().uuid(), captcha: graphic.optional() }).strict();
const verify = z.object({ phone: z.string().min(6).max(32), challenge_id: z.string().uuid(),
  otp: z.string().min(4).max(12).optional(), code: z.string().min(4).max(12).optional(),
  device_fingerprint: z.string().min(1).max(128).optional(), device_id: z.string().min(1).max(128).optional(),
}).strict().refine((body) => !!(body.otp || body.code) && !(body.otp && body.code && body.otp !== body.code));
const logout = z.object({ operation_id: z.string().uuid() }).strict();
const publicId = z.string().uuid();

export function registerPersistentAuthRoutes(app: FastifyInstance, service: PersistentAuthService) {
  if (app.authAuthority !== service) throw new AuthFault('AUTH_IMPLEMENTATION_UNAVAILABLE', 503);
  const context = (req: FastifyRequest): AuthRequestContext => {
    const native = req.authTransport === 'native';
    const binding = native ? singleHeader(req.headers['x-nomad-login-binding']) : req.cookies?.[service.cookieNames.binding];
    if (native && req.routeOptions.url?.startsWith('/auth/native/') && (!binding || !validCredential(binding))) throw new AuthFault('AUTH_BINDING_REQUIRED', 400);
    return { ip: req.ip, sessionSecret: req.authCredential, bindingSecret: binding, native };
  };
  const cookies = (req: FastifyRequest, reply: FastifyReply): AuthCookieSink => ({
    binding: (secret) => { reply.setCookie(service.cookieNames.binding, secret, { ...service.config.cookie, maxAge: service.config.sessionTtlSec }); },
    session: (secret, publicId) => {
      for (const name of Object.keys(req.cookies ?? {})) {
        if (name.startsWith(`${service.cookieNames.session}-`) && /^[-a-zA-Z0-9_]+$/.test(name)) reply.clearCookie(name, service.config.cookie);
      }
      reply.setCookie(service.sessionCookieName(publicId), secret, { ...service.config.cookie, maxAge: service.config.sessionTtlSec });
    },
    clearSession: (publicId) => { if (req.authTransport === 'native') return; reply.clearCookie(service.sessionCookieName(publicId), service.config.cookie); },
  });
  const safely = async (reply: FastifyReply, operation: () => Promise<unknown>) => {
    try { return await operation(); }
    catch (error) {
      const safe = error instanceof AuthFault ? error : new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
      if (safe.details?.retry_after_sec) reply.header('Retry-After', safe.details.retry_after_sec);
      return reply.sendError(safe.code, safe.code, safe.status, safe.retriable, safe.details);
    }
  };
  app.get('/auth/config', async () => service.publicConfig());
  for (const path of ['/auth/otp/start', '/auth/native/otp/start']) app.post(path, async (req, reply) => safely(reply, async () => {
    const parsed = start.safeParse(req.body);
    if (!parsed.success) throw new AuthFault('AUTH_PARAMS_INVALID', 400);
    return service.start({ phone: parsed.data.phone, region: parsed.data.region, requestId: parsed.data.request_id, captcha: parsed.data.captcha }, context(req),
      req.authTransport === 'native' ? { binding() {}, session() {}, clearSession() {} } : cookies(req, reply));
  }));
  for (const path of ['/auth/otp/verify', '/auth/native/otp/verify']) app.post(path, async (req, reply) => safely(reply, async () => {
    const parsed = verify.safeParse(req.body);
    if (!parsed.success) throw new AuthFault('AUTH_PARAMS_INVALID', 400);
    let nativeSecret: string | undefined;
    const result = await service.verify({ phone: parsed.data.phone, challengeId: parsed.data.challenge_id,
      code: parsed.data.otp ?? parsed.data.code!, deviceId: parsed.data.device_fingerprint ?? parsed.data.device_id ?? 'current' }, context(req),
      req.authTransport === 'native' ? { binding() {}, session(secret) { nativeSecret = secret; }, clearSession() {} } : cookies(req, reply));
    return nativeSecret ? { ...result, native_session_credential: nativeSecret } : result;
  }));
  app.get('/me', { preHandler: authGuard }, async (req) => publicUser(req.authPrincipal!));
  app.get('/sessions/me', { preHandler: authGuard }, async (req) => publicUser(req.authPrincipal!));
  app.get('/sessions', { preHandler: authGuard }, async (req, reply) => safely(reply, async () => ({
    sessions: (await service.repository.listSessions(req.user!.id)).map(publicSession),
  })));
  app.delete<{ Params: { id: string } }>('/sessions/:id', { preHandler: authGuard }, async (req, reply) => safely(reply, async () => {
    if (!publicId.safeParse(req.params.id).success) throw new AuthFault('AUTH_SESSION_NOT_FOUND', 404);
    if (!await service.repository.revokeSession(req.params.id, req.user!.id)) throw new AuthFault('AUTH_SESSION_NOT_FOUND', 404);
    if (req.params.id === req.authPrincipal!.id) cookies(req, reply).clearSession(req.authPrincipal!.id);
    return { ok: true };
  }));
  app.get('/ops/me', { preHandler: authGuard }, async (req, reply) => safely(reply, async () => {
    if (req.authTransport !== 'web') throw new AuthFault('AUTH_OPERATOR_FORBIDDEN', 403);
    const grants = await service.repository.capabilities(req.user!.id);
    if (!grants.length) throw new AuthFault('AUTH_OPERATOR_FORBIDDEN', 403);
    return { user_id: req.user!.id, grants };
  }));
  const operatorCheck = z.object({ capability: z.enum(operatorCapabilities), scope: z.string().refine(validOperatorScope),
    expected_grant_version: z.number().int().positive(), operation_id: z.string().uuid() }).strict();
  app.post('/ops/access-check', { preHandler: authGuard }, async (req, reply) => safely(reply, async () => {
    if (req.authTransport !== 'web') throw new AuthFault('AUTH_OPERATOR_FORBIDDEN', 403);
    const parsed = operatorCheck.safeParse(req.body);
    if (!parsed.success) throw new AuthFault('AUTH_PARAMS_INVALID', 400);
    const value = parsed.data;
    return service.repository.checkOperatorAccess(req.user!.id, value.capability, value.scope, value.expected_grant_version, value.operation_id);
  }));
  app.post('/logout', async (req, reply) => safely(reply, async () => {
    const parsed = logout.safeParse(req.body);
    const ownerId = singleHeader(req.headers['x-auth-user-id']);
    const sessionId = singleHeader(req.headers['x-auth-session-id']);
    if (!parsed.success || !publicId.safeParse(ownerId).success || !publicId.safeParse(sessionId).success) throw new AuthFault('AUTH_PARAMS_INVALID', 400);
    return service.logout(parsed.data.operation_id, ownerId!, sessionId!, context(req), cookies(req, reply));
  }));
}

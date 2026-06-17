import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import authRoutes from '../src/routes/auth.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJson(response: { body: string }) {
  return JSON.parse(response.body) as Record<string, any>;
}

function getSetCookie(response: { headers: Record<string, string | string[] | number | undefined> }) {
  const value = response.headers['set-cookie'];
  if (Array.isArray(value)) return value.join('; ');
  return String(value ?? '');
}

function getSidCookie(response: { headers: Record<string, string | string[] | number | undefined> }) {
  const setCookie = getSetCookie(response);
  const sid = setCookie.match(/sid=([^;]+)/)?.[1];
  assert(sid, 'expected sid Set-Cookie header');
  return `sid=${sid}`;
}

async function buildAuthApp() {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(errorEnvelope);
  await app.register(authPlugin);
  await app.register(authRoutes);
  await app.ready();
  return app;
}

async function main() {
  process.env.AUTH_CAPTCHA_MODE = 'risk';
  process.env.AUTH_CAPTCHA_RISK_DEVICES = 'risky-device';
  process.env.AUTH_PRIVACY_URL = 'https://nomad.test/privacy';
  process.env.AUTH_USER_AGREEMENT_URL = 'https://nomad.test/terms';
  process.env.AUTH_LOGIN_METHODS = 'phone,apple,wechat';
  process.env.AUTH_COOKIE_SECURE = 'false';
  process.env.AUTH_COOKIE_SAMESITE = 'lax';

  const app = await buildAuthApp();
  try {
    const invalidStart = await app.inject({
      method: 'POST',
      url: '/auth/otp/start',
      payload: { phone: '123', region: '' },
    });
    assert(invalidStart.statusCode === 400, 'invalid OTP start body should be rejected');
    assert(parseJson(invalidStart).error_code === 'AUTH_PARAMS_INVALID', 'invalid body should use standard error envelope');

    const config = await app.inject({ method: 'GET', url: '/auth/config' });
    assert(config.statusCode === 200, 'auth config should be available');
    const configBody = parseJson(config);
    assert(configBody.privacy_url === 'https://nomad.test/privacy', 'auth config should expose privacy URL');
    assert(configBody.user_agreement_url === 'https://nomad.test/terms', 'auth config should expose user agreement URL');
    assert(
      configBody.enabled_methods.map((method: { id: string }) => method.id).join(',') === 'phone,apple,wechat',
      'auth config should expose enabled login methods',
    );
    assert(
      configBody.ios_equal_weight_order.join(',') === 'apple,phone,wechat',
      'auth config should expose iOS equal-weight method order',
    );

    const normalStart = await app.inject({
      method: 'POST',
      url: '/auth/otp/start',
      headers: { 'x-device-id': 'normal-device' },
      payload: { phone: '+15550001111', region: 'US' },
    });
    assert(normalStart.statusCode === 200, 'normal OTP start should succeed');
    const normalBody = parseJson(normalStart);
    assert(normalBody.sent === true, 'normal OTP start should send');
    assert(normalBody.retry_after_sec === 60, 'OTP start should return retry timing');
    assert(normalBody.captcha_required === false, 'normal OTP start should not require captcha');

    const riskyStart = await app.inject({
      method: 'POST',
      url: '/auth/otp/start',
      headers: { 'x-device-id': 'risky-device' },
      payload: { phone: '+15550001111', region: 'US' },
    });
    assert(riskyStart.statusCode === 200, 'risky OTP start should still return contract response');
    const riskyBody = parseJson(riskyStart);
    assert(riskyBody.sent === false, 'captcha-required OTP start should not send before captcha');
    assert(riskyBody.retry_after_sec === 60, 'captcha-required OTP start should keep retry timing');
    assert(riskyBody.captcha_required === true, 'risky OTP start should require captcha');

    const captchaSatisfied = await app.inject({
      method: 'POST',
      url: '/auth/otp/start',
      headers: { 'x-device-id': 'risky-device' },
      payload: { phone: '+15550001111', region: 'US', captcha_token: 'captcha-ok' },
    });
    assert(captchaSatisfied.statusCode === 200, 'captcha token should satisfy OTP start');
    assert(parseJson(captchaSatisfied).captcha_required === false, 'satisfied captcha should clear captcha_required');

    const unauthMe = await app.inject({ method: 'GET', url: '/me' });
    assert(unauthMe.statusCode === 401, 'missing auth should be rejected');
    assert(parseJson(unauthMe).error_code === 'AUTH_SESSION_EXPIRED', 'missing auth should use auth error envelope');

    const verify = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      headers: { 'x-device-id': 'ios-device' },
      payload: { phone: '+15550001111', otp: '000000', device_fingerprint: 'ios-device' },
    });
    assert(verify.statusCode === 200, 'OTP verify should succeed');
    const verifyBody = parseJson(verify);
    assert(typeof verifyBody.user_id === 'string' && verifyBody.user_id.length > 2, 'OTP verify should return user_id');
    assert(verifyBody.session.device_id === 'ios-device', 'OTP verify should return session metadata');
    const setCookie = getSetCookie(verify);
    assert(setCookie.includes('HttpOnly'), 'session cookie should be httpOnly');
    assert(setCookie.includes('SameSite=Lax'), 'session cookie should use SameSite=Lax by default');
    const sidCookie = getSidCookie(verify);

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie: sidCookie } });
    assert(me.statusCode === 200, '/me should return current user when authenticated');
    assert(parseJson(me).user_id === verifyBody.user_id, '/me should return matching user_id');

    const sessionMe = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: sidCookie } });
    assert(sessionMe.statusCode === 200, '/sessions/me should return current session');
    assert(parseJson(sessionMe).session.id === verifyBody.session.id, '/sessions/me should return matching session');

    const sessions = await app.inject({ method: 'GET', url: '/sessions', headers: { cookie: sidCookie } });
    assert(sessions.statusCode === 200, '/sessions should list sessions');
    assert(parseJson(sessions).sessions[0].id === verifyBody.session.id, '/sessions should include current session');

    const sessionDelete = await app.inject({
      method: 'DELETE',
      url: `/sessions/${verifyBody.session.id}`,
      headers: { cookie: sidCookie },
    });
    assert(sessionDelete.statusCode === 200, 'session delete should succeed');
    assert(parseJson(sessionDelete).ok === true, 'session delete should return ok');
    assert(getSetCookie(sessionDelete).includes('sid='), 'session delete should clear sid cookie');

    const verifyAgain = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      headers: { 'x-device-id': 'ios-device' },
      payload: { phone: '+15550001111', otp: '000000', device_fingerprint: 'ios-device' },
    });
    const secondSidCookie = getSidCookie(verifyAgain);
    const logout = await app.inject({ method: 'POST', url: '/logout', headers: { cookie: secondSidCookie } });
    assert(logout.statusCode === 200, 'logout should succeed');
    assert(parseJson(logout).ok === true, 'logout should return ok');
    assert(getSetCookie(logout).includes('sid='), 'logout should clear sid cookie');
  } finally {
    await app.close();
  }

  console.log('auth contract probe ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

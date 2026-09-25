import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import type { AuthRuntimeConfig } from './runtime-config.js';
import { AuthFault } from './errors.js';

export type GraphicProof = { lot_number: string; captcha_output: string; pass_token: string; gen_time: string };
export interface SmsTransport {
  send(input: Record<string, unknown>): Promise<unknown>;
  check(input: Record<string, unknown>): Promise<unknown>;
}
export interface PhoneProofProvider {
  send(phone: string, transactionId: string): Promise<void>;
  verify(phone: string, code: string, transactionId: string): Promise<boolean>;
  verifyGraphic(proof: GraphicProof): Promise<void>;
}
type PhoneConfig = Extract<AuthRuntimeConfig['provider'], { kind: 'aliyun-pnvs' }>;
type GraphicConfig = Extract<AuthRuntimeConfig['captcha'], { kind: 'aliyun-pnvs' }>;
type Dependencies = { sms?: SmsTransport; fetch?: typeof fetch; timeoutMs?: number };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

// Only documented PNVS rejections are certain non-delivery; unknown codes stay conservative.
function sendRejection(code: unknown): AuthFault | undefined {
  if (['BUSINESS_LIMIT_CONTROL', 'FREQUENCY_FAIL'].includes(String(code))) return new AuthFault('AUTH_PROVIDER_RATE_LIMITED', 429, true, { retry_after_sec: 60 });
  if (['MOBILE_NUMBER_ILLEGAL', 'INVALID_PARAMETERS', 'FUNCTION_NOT_OPENED'].includes(String(code))) return new AuthFault('AUTH_SEND_REJECTED', 503);
}

function sdkTransport(config: PhoneConfig): SmsTransport {
  // The vendor's published 2.x SDK is CommonJS. Load its explicit exports, not a guessed ESM default.
  const require = createRequire(import.meta.url);
  const sdk = require('@alicloud/dypnsapi20170525') as typeof import('@alicloud/dypnsapi20170525');
  const core = require('@alicloud/openapi-core') as typeof import('@alicloud/openapi-core');
  const dara = require('@darabonba/typescript') as typeof import('@darabonba/typescript');
  const client = new sdk.default(new core.$OpenApiUtil.Config({
    accessKeyId: config.accessKeyId, accessKeySecret: config.accessKeySecret, securityToken: config.securityToken,
    type: config.securityToken ? 'sts' : 'access_key', endpoint: 'dypnsapi.aliyuncs.com', protocol: 'HTTPS',
    connectTimeout: 2000, readTimeout: 5000,
  }));
  const runtime = () => new dara.RuntimeOptions({ autoretry: false, maxAttempts: 1, connectTimeout: 2000, readTimeout: 5000, ignoreSSL: false });
  return {
    send: async (input) => (await client.sendSmsVerifyCodeWithOptions(new sdk.SendSmsVerifyCodeRequest(input), runtime())).body,
    check: async (input) => (await client.checkSmsVerifyCodeWithOptions(new sdk.CheckSmsVerifyCodeRequest(input), runtime())).body,
  };
}

async function deadline<T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('provider deadline')); }, milliseconds); }),
    ]);
  } finally { if (timer) clearTimeout(timer); controller.abort(); }
}

async function boundedJson(response: Response) {
  if (!response.ok || !response.body) throw new Error('invalid response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 65536 || chunks.length > 1024) throw new Error('oversized response');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally { await reader.cancel().catch(() => undefined); }
}

export class PnvsProofProvider implements PhoneProofProvider {
  private readonly sms: SmsTransport;
  private readonly fetch: typeof fetch;
  private readonly timeoutMs: number;
  constructor(private readonly config: PhoneConfig, private readonly graphic: GraphicConfig, dependencies: Dependencies = {}) {
    this.sms = dependencies.sms ?? sdkTransport(config);
    this.fetch = dependencies.fetch ?? globalThis.fetch;
    this.timeoutMs = dependencies.timeoutMs ?? 8000;
  }

  async send(phone: string, transactionId: string) {
    try {
      const body = object(await deadline(() => this.sms.send({
        phoneNumber: phone.slice(3), countryCode: '86', outId: transactionId, schemeName: this.config.schemeName,
        signName: this.config.signName, templateCode: this.config.templateCode,
        templateParam: JSON.stringify(this.config.templateParam), codeLength: this.config.codeLength,
        codeType: this.config.codeType, validTime: this.config.validTimeSec, interval: this.config.intervalSec,
        duplicatePolicy: this.config.duplicatePolicy, returnVerifyCode: false, autoRetry: 0,
      }), this.timeoutMs));
      const rejected = body.success === false ? sendRejection(body.code) : undefined;
      if (rejected) throw rejected;
      const model = object(body.model);
      if (body.code !== 'OK' || body.success !== true || typeof model.bizId !== 'string' || !model.bizId
        || (model.outId !== undefined && model.outId !== transactionId)) throw new Error('unconfirmed send');
    } catch (error) {
      if (error instanceof AuthFault) throw error;
      const rejected = sendRejection(object(error).code);
      if (rejected) throw rejected;
      // Even a transport timeout may have delivered a message. Never repeat the send automatically.
      throw new AuthFault('AUTH_SEND_RESULT_UNKNOWN', 503, false, { challenge_id: transactionId });
    }
  }

  async verify(phone: string, code: string, transactionId: string) {
    try {
      const body = object(await deadline(() => this.sms.check({
        phoneNumber: phone.slice(3), countryCode: '86', verifyCode: code, outId: transactionId,
        schemeName: this.config.schemeName, caseAuthPolicy: 1,
      }), this.timeoutMs));
      const model = object(body.model);
      if (body.code !== 'OK' || body.success !== true || (model.outId !== undefined && model.outId !== transactionId)
        || !['PASS', 'UNKNOWN'].includes(String(model.verifyResult))) throw new Error('invalid verification response');
      return model.verifyResult === 'PASS';
    } catch { throw new AuthFault('AUTH_PROVIDER_UNAVAILABLE', 503, true); }
  }

  async verifyGraphic(proof: GraphicProof) {
    try {
      const body = object(await deadline(async (signal) => {
        const form = new URLSearchParams({ ...proof, sign_token: createHmac('sha256', this.graphic.appKey).update(proof.lot_number).digest('hex') });
        const response = await this.fetch(`https://captcha.alicaptcha.com/validate?captcha_id=${encodeURIComponent(this.graphic.appId)}`, {
          method: 'POST', signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(),
          redirect: 'error',
        });
        return boundedJson(response);
      }, this.timeoutMs));
      if (body.status === 'success' && body.result === 'fail') throw new AuthFault('AUTH_CAPTCHA_FAILED', 400);
      if (body.status !== 'success' || body.result !== 'success' || object(body.captcha_args).lot_number !== proof.lot_number) {
        throw new Error('unverified graphic result');
      }
    } catch (error) {
      if (error instanceof AuthFault) throw error;
      // In particular, never adopt the vendor demo's success-on-network-exception branch.
      throw new AuthFault('AUTH_CAPTCHA_UNAVAILABLE', 503, true);
    }
  }
}

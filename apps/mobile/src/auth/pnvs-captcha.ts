import type { components } from 'nomad-types/src/api-types';

type Proof = components['schemas']['PnvsCaptchaProof'];
type Config = components['schemas']['AuthCaptchaConfig'];
interface Widget {
  onNextReady(callback: () => void): Widget;
  onSuccess(callback: () => void): Widget;
  onError(callback: () => void): Widget;
  onClose(callback: () => void): Widget;
  showCaptcha(): void;
  getValidate(): unknown;
  destroy(): void;
}
interface Options { captchaId: string; product: 'bind'; https: true; language: 'zho'; onError: () => void; offlineCb: () => void }
declare global { interface Window { initAlicom4?: (options: Options, callback: (widget: Widget) => void) => void } }
class CaptchaError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'CaptchaError'; }
}
let loading: Promise<void> | undefined;
async function load() {
  if (window.initAlicom4) return;
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/pnvs/ct4.js'; script.async = true;
      script.integrity = 'sha256-8unQDBTgeVkDZ7/22+sJsUL21LE1PFavs8qk19AWSGE='; script.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { script.remove(); reject(new CaptchaError('AUTH_CAPTCHA_UNAVAILABLE')); }, 15000);
      script.onload = () => { clearTimeout(timer); window.initAlicom4 ? resolve() : reject(new CaptchaError('AUTH_CAPTCHA_UNAVAILABLE')); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new CaptchaError('AUTH_CAPTCHA_UNAVAILABLE')); };
      document.head.append(script);
    }).catch((error) => { loading = undefined; throw error; });
  }
  await loading;
}

export async function requestPnvsCaptcha(config: Config, signal?: AbortSignal): Promise<Proof> {
  if (config.provider !== 'aliyun-pnvs' || !config.app_id || config.sdk_url !== '/vendor/pnvs/ct4.js') throw new CaptchaError('AUTH_CAPTCHA_UNAVAILABLE');
  if (signal?.aborted) throw new CaptchaError('AUTH_CAPTCHA_CANCELLED');
  await load();
  return new Promise<Proof>((resolve, reject) => {
    let widget: Widget | undefined; let settled = false;
    const finish = (value?: Proof, code = 'AUTH_CAPTCHA_UNAVAILABLE') => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      try { widget?.destroy(); } catch { /* A vendor cleanup error must not grant authentication. */ }
      value ? resolve(value) : reject(new CaptchaError(code));
    };
    const abort = () => finish(undefined, 'AUTH_CAPTCHA_CANCELLED');
    const timer = setTimeout(() => finish(), 120000);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    try {
      window.initAlicom4!({ captchaId: config.app_id!, product: 'bind', language: 'zho', https: true,
        onError: () => finish(), offlineCb: () => finish() }, (instance) => {
        if (settled) { instance.destroy(); return; }
        widget = instance;
        widget.onSuccess(() => {
          try {
            const raw = widget!.getValidate();
            if (!raw || typeof raw !== 'object') { finish(undefined, 'AUTH_CAPTCHA_INVALID'); return; }
            const fields = raw as Record<string, unknown>;
            if (fields.captcha_id !== undefined && fields.captcha_id !== config.app_id) { finish(undefined, 'AUTH_CAPTCHA_INVALID'); return; }
            const result = { lot_number: fields.lot_number, captcha_output: fields.captcha_output, pass_token: fields.pass_token, gen_time: fields.gen_time };
            const limits = { lot_number: 128, captcha_output: 4096, pass_token: 1024, gen_time: 32 };
            if (Object.entries(result).some(([key, value]) => typeof value !== 'string' || !value || value.length > limits[key as keyof typeof limits])) {
              finish(undefined, 'AUTH_CAPTCHA_INVALID'); return;
            }
            finish(result as Proof);
          } catch { finish(undefined, 'AUTH_CAPTCHA_INVALID'); }
        }).onError(() => finish()).onClose(abort).onNextReady(() => {
          if (!settled) { try { widget?.showCaptcha(); } catch { finish(); } }
        });
      });
    } catch { finish(); }
  });
}

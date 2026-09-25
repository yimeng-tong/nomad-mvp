import { createHash, randomBytes } from 'node:crypto';
import { AuthFault } from './errors.js';

export const newCredential = () => randomBytes(32).toString('base64url');
export const validCredential = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
export const credentialHash = (value: string) => createHash('sha256').update(`session\0${value}`).digest('hex');
export const browserBindingHash = (value: string) => createHash('sha256').update(`login-binding\0${value}`).digest('hex');
export const nativeCredentialHash = (value: string, audience: string) => createHash('sha256').update(`native-session\0${audience}\0${value}`).digest('hex');
export const nativeBindingHash = (value: string, audience: string) => createHash('sha256').update(`native-binding\0${audience}\0${value}`).digest('hex');
export const proofHash = (value: string) => createHash('sha256').update(`captcha-proof\0${value}`).digest('hex');

export function normalizeCnPhone(value: string, region = 'CN'): string {
  if (region !== 'CN') throw new AuthFault('AUTH_REGION_UNSUPPORTED', 400);
  const match = value.trim().replace(/[ -]/g, '').match(/^(?:\+?86)?(1[3-9]\d{9})$/);
  if (!match) throw new AuthFault('AUTH_PARAMS_INVALID', 400);
  return `+86${match[1]}`;
}

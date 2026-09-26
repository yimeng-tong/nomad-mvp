import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type ImportUrlKeyring = { activeKeyId: string; keys: ReadonlyMap<string, Buffer> };
export type ProtectedImportUrl = {
  version: 1;
  key_id: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

type Scope = { ownerId: string; recordId: string };
type SealInput = Scope & { originalUrl: string };

const keyIdPattern = /^[A-Za-z0-9_-]{1,32}$/u;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

function unavailable(): never { throw new Error('INGEST_URL_PROTECTION_UNAVAILABLE'); }
function invalid(): never { throw new Error('INGEST_URL_PROTECTION_INVALID'); }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function validKey(value: Buffer | undefined): value is Buffer {
  return Buffer.isBuffer(value) && value.length === 32 && value.some((byte) => byte !== 0);
}
function strictBase64(value: unknown, size?: number): Buffer {
  if (typeof value !== 'string' || !value || value.length > 8192 || !base64Pattern.test(value)) invalid();
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || size !== undefined && bytes.length !== size) invalid();
  return bytes;
}
function aad(scope: Scope): Buffer {
  if (!uuidPattern.test(scope.ownerId) || !uuidPattern.test(scope.recordId)) invalid();
  return Buffer.from(JSON.stringify(['nomad.import-url', 1, scope.ownerId.toLowerCase(), scope.recordId.toLowerCase()]));
}

/** Server-only configuration. Missing or invalid material never falls back to a development key. */
export function loadImportUrlKeyring(env: Record<string, string | undefined>): ImportUrlKeyring {
  const raw = env.IMPORT_URL_KEYRING_JSON;
  if (!raw || raw.length > 8192) unavailable();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || typeof parsed.activeKeyId !== 'string' || !keyIdPattern.test(parsed.activeKeyId)
      || !object(parsed.keys)) unavailable();
    const entries = Object.entries(parsed.keys);
    if (entries.length < 1 || entries.length > 8) unavailable();
    const keys = new Map<string, Buffer>();
    for (const [id, encoded] of entries) {
      if (!keyIdPattern.test(id)) unavailable();
      const decoded = strictBase64(encoded, 32);
      if (!validKey(decoded)) unavailable();
      keys.set(id, decoded);
    }
    if (!keys.has(parsed.activeKeyId)) unavailable();
    return { activeKeyId: parsed.activeKeyId, keys };
  } catch {
    unavailable();
  }
}

export function sealImportOriginalUrl(input: SealInput, keyring: ImportUrlKeyring): ProtectedImportUrl {
  const key = keyring.keys.get(keyring.activeKeyId);
  if (!keyIdPattern.test(keyring.activeKeyId) || !validKey(key)) unavailable();
  const plaintext = Buffer.from(input.originalUrl, 'utf8');
  if (!plaintext.length || plaintext.length > 4096) invalid();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad(input));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { version: 1, key_id: keyring.activeKeyId, iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
}

export function openImportOriginalUrl(envelope: ProtectedImportUrl, scope: Scope, keyring: ImportUrlKeyring): string {
  if (!object(envelope) || envelope.version !== 1 || typeof envelope.key_id !== 'string' || !keyIdPattern.test(envelope.key_id)) invalid();
  const key = keyring.keys.get(envelope.key_id);
  if (!validKey(key)) unavailable();
  const iv = strictBase64(envelope.iv, 12);
  const tag = strictBase64(envelope.tag, 16);
  const ciphertext = strictBase64(envelope.ciphertext);
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(aad(scope));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    invalid();
  }
}

import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export type WrappedDEK = {
  keyId: string;
  wrapped: string; // base64
};

export type SealedPayload = {
  alg: 'AES-256-GCM';
  iv: string; // base64
  tag: string; // base64
  ciphertext: string; // base64
};

function getLocalCmk(): Buffer {
  const cmkB64 = process.env.LOCAL_KMS_CMK_B64;
  const buf = cmkB64 ? Buffer.from(cmkB64, 'base64') : undefined;
  return buf && buf.length === 32 ? buf : Buffer.alloc(32, 0);
}

export function generateDek(): Buffer {
  return randomBytes(32);
}

export function wrapDek(dek: Buffer, keyId = 'local-cmk'): WrappedDEK {
  const cmk = getLocalCmk();
  const iv = Buffer.alloc(12, 0);
  const cipher = createCipheriv('aes-256-gcm', cmk, iv);
  const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { keyId, wrapped: Buffer.concat([wrapped, tag]).toString('base64') };
}

export function unwrapDek(wrapped: WrappedDEK): Buffer {
  const cmk = getLocalCmk();
  const raw = Buffer.from(wrapped.wrapped, 'base64');
  const body = raw.subarray(0, raw.length - 16);
  const tag = raw.subarray(raw.length - 16);
  const iv = Buffer.alloc(12, 0);
  const decipher = createDecipheriv('aes-256-gcm', cmk, iv);
  decipher.setAuthTag(tag);
  const dek = Buffer.concat([decipher.update(body), decipher.final()]);
  return dek;
}

export function sealWithDek(dek: Buffer, plaintext: Buffer): SealedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dek, iv);
  const c = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: c.toString('base64'),
  };
}

export function openWithDek(dek: Buffer, sealed: SealedPayload): Buffer {
  const iv = Buffer.from(sealed.iv, 'base64');
  const tag = Buffer.from(sealed.tag, 'base64');
  const data = Buffer.from(sealed.ciphertext, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}



import { createHash } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AuthFault } from '../auth/errors.js';

const maxObjectBytes = 32 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const storedKeyPattern = /^owners\/([0-9a-f-]{36})\/ingest\/([0-9a-f-]{36})\/([0-9a-f]{64})\.(jpg|png|webp|gif|avif|mp4|webm)$/u;
const mediaTypes = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'],
  ['image/gif', 'gif'], ['image/avif', 'avif'], ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
]);

type ObjectConfig = { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string };

function config(env: NodeJS.ProcessEnv = process.env): ObjectConfig {
  const endpoint = env.NOMAD_OBJECT_ENDPOINT;
  const bucket = env.NOMAD_OBJECT_BUCKET;
  const accessKeyId = env.NOMAD_OBJECT_ACCESS_KEY_ID;
  const secretAccessKey = env.NOMAD_OBJECT_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
    throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
  let url: URL;
  try { url = new URL(endpoint); }
  catch { throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || url.pathname !== '/' || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u.test(bucket)
      || accessKeyId.length < 12 || secretAccessKey.length < 32)
    throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
  return { endpoint: url.origin, bucket, accessKeyId, secretAccessKey };
}

function client(settings: ObjectConfig): S3Client {
  return new S3Client({ endpoint: settings.endpoint, region: 'us-east-1', forcePathStyle: true,
    maxAttempts: 2, credentials: { accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey } });
}

/** Store bytes only after a trusted downloader has bounded and classified them. */
export async function putMediaBytes(input: { ownerId: string; jobId: string; bytes: Uint8Array;
  contentType: string }): Promise<{ cosKey: string; sha256: string }> {
  if (!uuidPattern.test(input.ownerId) || !uuidPattern.test(input.jobId)
      || input.bytes.byteLength < 1 || input.bytes.byteLength > maxObjectBytes
      || !mediaTypes.has(input.contentType)) throw new AuthFault('MEDIA_OBJECT_INVALID', 400);
  const settings = config();
  const sha256 = createHash('sha256').update(input.bytes).digest('hex');
  const suffix = mediaTypes.get(input.contentType)!;
  const cosKey = `owners/${input.ownerId.toLowerCase()}/ingest/${input.jobId.toLowerCase()}/${sha256}.${suffix}`;
  const s3 = client(settings);
  try {
    await s3.send(new PutObjectCommand({ Bucket: settings.bucket, Key: cosKey,
      Body: input.bytes, ContentType: input.contentType,
      Metadata: { sha256 } }));
  } catch { throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true); }
  finally { s3.destroy(); }
  return { cosKey, sha256 };
}

/** Caller must qualify the current owner and active Asset row before passing its key. */
export async function getMediaBytes(cosKey: string): Promise<{ bytes: Buffer; contentType: string }> {
  const key = storedKeyPattern.exec(cosKey);
  if (!key || !uuidPattern.test(key[1]!) || !uuidPattern.test(key[2]!))
    throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
  const settings = config();
  const s3 = client(settings);
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: settings.bucket, Key: cosKey }));
    if (!response.Body || !response.ContentLength || response.ContentLength > maxObjectBytes
        || !response.ContentType || !mediaTypes.has(response.ContentType))
      throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      total += chunk.byteLength;
      if (total > maxObjectBytes || total > response.ContentLength)
        throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
      chunks.push(Buffer.from(chunk));
    }
    if (total !== response.ContentLength) throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
    const bytes = Buffer.concat(chunks, total);
    if (createHash('sha256').update(bytes).digest('hex') !== key[3]
        || mediaTypes.get(response.ContentType) !== key[4])
      throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true);
    return { bytes, contentType: response.ContentType };
  } catch { throw new AuthFault('MEDIA_OBJECT_UNAVAILABLE', 503, true); }
  finally { s3.destroy(); }
}

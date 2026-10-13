import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

const logger = new Logger('S3Storage');

interface S3Settings {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

/** Настройки S3 из окружения; null - хранилище не настроено, работаем с локальным диском. */
export function s3Settings(): S3Settings | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET ?? 'sto-media';
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  if (
    endpoint === undefined ||
    endpoint === '' ||
    accessKey === undefined ||
    accessKey === '' ||
    secretKey === undefined ||
    secretKey === ''
  ) {
    return null;
  }
  return { endpoint, bucket, accessKey, secretKey };
}

let cached: { settings: S3Settings; client: S3Client } | null = null;

function s3Client(settings: S3Settings): S3Client {
  if (cached !== null && cached.settings.endpoint === settings.endpoint) {
    return cached.client;
  }
  const client = new S3Client({
    endpoint: settings.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: settings.accessKey, secretAccessKey: settings.secretKey },
  });
  cached = { settings, client };
  return client;
}

let bucketEnsured = false;

/** SeaweedFS стартует без бакетов - создаём при первой загрузке. */
async function ensureBucket(settings: S3Settings): Promise<boolean> {
  if (bucketEnsured) {
    return true;
  }
  try {
    await s3Client(settings).send(new CreateBucketCommand({ Bucket: settings.bucket }));
  } catch {
    // уже существует (или нет прав на создание, но есть на запись) - не страшно
  }
  bucketEnsured = true;
  return true;
}

/** Кладёт картинку в S3; false - S3 не настроен или не записалось. */
export async function s3PutImage(key: string, body: Buffer, contentType: string): Promise<boolean> {
  const settings = s3Settings();
  if (settings === null) {
    return false;
  }
  try {
    await ensureBucket(settings);
    await s3Client(settings).send(
      new PutObjectCommand({
        Bucket: settings.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return true;
  } catch (error) {
    logger.warn(`PUT ${key} не удался: ${String(error).slice(0, 120)}`);
    return false;
  }
}

/** Достаёт объект из S3; null - не настроен или не найден. */
export async function s3GetImage(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const settings = s3Settings();
  if (settings === null) {
    return null;
  }
  try {
    const output = await s3Client(settings).send(
      new GetObjectCommand({ Bucket: settings.bucket, Key: key }),
    );
    if (output.Body === undefined) {
      return null;
    }
    const contentType = output.ContentType ?? 'application/octet-stream';
    return { body: Buffer.from(await output.Body.transformToByteArray()), contentType };
  } catch (error) {
    // Основной случай - NoSuchKey (файла нет); прочее видно в логе.
    if (!String(error).includes('NoSuchKey')) {
      logger.warn(`GET ${key} не удался: ${String(error).slice(0, 120)}`);
    }
    return null;
  }
}

/** Удаляет объект, если он есть; ошибки молча игнорируются (файл мог не существовать). */
export async function s3DeleteImage(key: string): Promise<void> {
  const settings = s3Settings();
  if (settings === null) {
    return;
  }
  try {
    await s3Client(settings).send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: key }));
  } catch {
    // удаление не критично
  }
}

const KEY_PATTERN = /^[\w][\w/.-]*$/;

/** '/uploads/news/a.jpg' -> 'news/a.jpg'; null для чужих путей. */
export function s3KeyForUrl(url: string): string | null {
  if (!url.startsWith('/uploads/')) {
    return null;
  }
  const key = url.slice('/uploads/'.length);
  if (key === '' || !KEY_PATTERN.test(key) || key.includes('..')) {
    return null;
  }
  return key;
}

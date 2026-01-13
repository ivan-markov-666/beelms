import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.TWO_FA_ENCRYPTION_KEY ?? '';
  if (!raw || raw.trim().length === 0) {
    const fallback =
      process.env.NODE_ENV !== 'production'
        ? (process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me')
        : '';

    if (!fallback) {
      throw new Error('TWO_FA_ENCRYPTION_KEY is not set');
    }

    return createHash('sha256').update(fallback, 'utf8').digest();
  }

  const normalized = raw.trim();

  try {
    const hexBuf = Buffer.from(normalized, 'hex');
    if (hexBuf.length === 32) {
      return hexBuf;
    }
  } catch {
    // ignore
  }

  try {
    const b64Buf = Buffer.from(normalized, 'base64');
    if (b64Buf.length === 32) {
      return b64Buf;
    }
  } catch {
    // ignore
  }

  return createHash('sha256').update(normalized, 'utf8').digest();
}

export function encryptTwoFactorSecret(secret: string): string {
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptTwoFactorSecret(payload: string): string {
  const parts = (payload ?? '').split(':');
  if (parts.length !== 3) {
    throw new Error('invalid encrypted secret format');
  }

  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

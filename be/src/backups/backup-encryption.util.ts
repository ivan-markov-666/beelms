import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import type { Transform } from 'stream';
import type { BackupEncryptionMeta } from './backup.entity';

const ALGORITHM: BackupEncryptionMeta['alg'] = 'aes-256-gcm';
const IV_BYTES = 12;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const DEFAULT_ITERATIONS = 210_000;

function deriveKey(password: string, salt: Buffer, iterations: number): Buffer {
  if (!password || password.trim().length === 0) {
    throw new Error('Encryption password is required');
  }

  if (!Number.isFinite(iterations) || iterations <= 0) {
    throw new Error('Invalid encryption iterations');
  }

  return pbkdf2Sync(password, salt, iterations, KEY_BYTES, 'sha256');
}

export async function encryptFileInPlace(
  inputPath: string,
  password: string,
  options?: { iterations?: number },
): Promise<BackupEncryptionMeta> {
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(password, salt, iterations);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const dir = path.dirname(inputPath);
  const tmpOut = path.join(
    dir,
    `.tmp_${path.basename(inputPath)}.${Date.now()}.${Math.random().toString(16).slice(2)}`,
  );

  try {
    await pipeline(
      fs.createReadStream(inputPath),
      cipher,
      fs.createWriteStream(tmpOut, { flags: 'w' }),
    );

    const tag = cipher.getAuthTag();

    await fs.promises.rename(tmpOut, inputPath);

    return {
      alg: ALGORITHM,
      saltB64: salt.toString('base64'),
      ivB64: iv.toString('base64'),
      tagB64: tag.toString('base64'),
      iterations,
    };
  } catch (err) {
    try {
      await fs.promises.rm(tmpOut, { force: true });
    } catch {
      void 0;
    }
    throw err;
  }
}

export async function decryptFileToPath(
  inputPath: string,
  outputPath: string,
  password: string,
  meta: BackupEncryptionMeta,
): Promise<void> {
  if (!meta || meta.alg !== ALGORITHM) {
    throw new Error('Unsupported encryption algorithm');
  }

  const salt = Buffer.from(meta.saltB64, 'base64');
  const iv = Buffer.from(meta.ivB64, 'base64');
  const tag = Buffer.from(meta.tagB64, 'base64');
  const iterations = meta.iterations;

  const key = deriveKey(password, salt, iterations);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  await pipeline(
    fs.createReadStream(inputPath),
    decipher,
    fs.createWriteStream(outputPath, { flags: 'w' }),
  );
}

export function createDecryptionStream(
  password: string,
  meta: BackupEncryptionMeta,
): Transform {
  if (!meta || meta.alg !== ALGORITHM) {
    throw new Error('Unsupported encryption algorithm');
  }

  const salt = Buffer.from(meta.saltB64, 'base64');
  const iv = Buffer.from(meta.ivB64, 'base64');
  const tag = Buffer.from(meta.tagB64, 'base64');
  const iterations = meta.iterations;

  const key = deriveKey(password, salt, iterations);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher;
}

import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31;
      output += BASE32_ALPHABET[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 31;
    output += BASE32_ALPHABET[index];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const normalized = (input ?? '').toUpperCase().replace(/=+$/g, '');

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const ch of normalized) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      continue;
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number, digits: number): string {
  const buf = Buffer.alloc(8);
  const big = BigInt(counter);
  buf.writeBigUInt64BE(big);

  const hmac = createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = 10 ** digits;
  const token = (code % mod).toString().padStart(digits, '0');
  return token;
}

export function generateTwoFactorSecret(): string {
  return base32Encode(randomBytes(20));
}

export function buildOtpAuthUrl(params: {
  issuer: string;
  email: string;
  secret: string;
}): string {
  const issuer = encodeURIComponent(params.issuer);
  const email = encodeURIComponent(params.email);
  const secret = encodeURIComponent(params.secret);

  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(params: {
  token: string;
  secret: string;
  nowMs?: number;
  window?: number;
}): boolean {
  const token = (params.token ?? '').trim();
  if (!/^[0-9]{6}$/.test(token)) {
    return false;
  }

  const nowMs = params.nowMs ?? Date.now();
  const window = typeof params.window === 'number' ? params.window : 1;

  const key = base32Decode(params.secret);
  if (key.length < 1) {
    return false;
  }

  const stepSeconds = 30;
  const counter = Math.floor(nowMs / 1000 / stepSeconds);

  for (let w = -window; w <= window; w += 1) {
    const expected = hotp(key, counter + w, 6);
    if (expected === token) {
      return true;
    }
  }

  return false;
}

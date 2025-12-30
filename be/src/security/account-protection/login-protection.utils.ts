import type { Request } from 'express';

type LoginBody = { email?: unknown };

export const LOGIN_PROTECTION_WINDOW_MS = 5 * 60 * 1000;

export function normalizeLoginEmailValue(emailRaw: unknown): string {
  if (typeof emailRaw === 'string') {
    const normalized = emailRaw.trim().toLowerCase();
    return normalized.length > 0 ? normalized : 'unknown';
  }

  return 'unknown';
}

export function getLoginEmailFromRequest(req: Request): string {
  const emailRaw = (req.body as LoginBody | undefined)?.email;
  return normalizeLoginEmailValue(emailRaw);
}

export function getClientIp(req: Request): string {
  const raw = req.headers['x-forwarded-for'];

  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.split(',')[0].trim();
  }

  if (Array.isArray(raw) && raw.length > 0) {
    return String(raw[0]).trim();
  }

  return (req.ip ?? '').trim() || 'unknown';
}

export function buildLoginAttemptKey(ip: string, email: string): string {
  return `${ip}|${email}`;
}

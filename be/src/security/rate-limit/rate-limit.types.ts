export type RateLimitKey = 'ip' | 'userId' | 'ip+email';

export type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
  key: RateLimitKey;
};

export const RATE_LIMIT_METADATA_KEY = 'rate_limit_options';

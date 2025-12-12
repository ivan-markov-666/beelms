import { Injectable } from '@nestjs/common';

type RateLimitEntry = {
  count: number;
  resetAtMs: number;
};

export type RateLimitConsumeResult = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
};

@Injectable()
export class InMemoryRateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();

  consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): RateLimitConsumeResult {
    const nowMs = Date.now();
    const windowMs = Math.max(1, windowSeconds) * 1000;

    const existing = this.entries.get(key);

    if (!existing || existing.resetAtMs <= nowMs) {
      const resetAtMs = nowMs + windowMs;
      this.entries.set(key, { count: 1, resetAtMs });
      this.pruneIfNeeded(nowMs);
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAtMs };
    }

    const nextCount = existing.count + 1;
    existing.count = nextCount;

    const remaining = Math.max(0, limit - nextCount);
    const allowed = nextCount <= limit;

    this.pruneIfNeeded(nowMs);

    return { allowed, remaining, resetAtMs: existing.resetAtMs };
  }

  private pruneIfNeeded(nowMs: number): void {
    if (this.entries.size < 10_000) {
      return;
    }

    for (const [key, entry] of this.entries.entries()) {
      if (entry.resetAtMs <= nowMs) {
        this.entries.delete(key);
      }
    }
  }
}

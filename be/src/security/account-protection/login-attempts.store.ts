import { Injectable } from '@nestjs/common';

type AttemptState = {
  failures: number[];
  blockedUntilMs?: number;
};

@Injectable()
export class InMemoryLoginAttemptStore {
  private readonly states = new Map<string, AttemptState>();

  isBlocked(key: string, nowMs: number): boolean {
    const state = this.states.get(key);
    if (!state?.blockedUntilMs) {
      return false;
    }

    if (state.blockedUntilMs <= nowMs) {
      delete state.blockedUntilMs;

      if (state.failures.length === 0) {
        this.states.delete(key);
      }
      return false;
    }

    return true;
  }

  recordFailure(
    key: string,
    nowMs: number,
    windowMs: number,
    maxFailures: number,
    blockMs: number,
  ): void {
    const state = this.states.get(key) ?? { failures: [] };

    this.prune(key, state, nowMs, windowMs);

    state.failures.push(nowMs);

    if (state.failures.length >= maxFailures) {
      state.blockedUntilMs = nowMs + blockMs;
    }

    this.states.set(key, state);
  }

  clear(key: string): void {
    this.states.delete(key);
  }

  private prune(
    key: string,
    state: AttemptState,
    nowMs: number,
    windowMs: number,
  ): void {
    if (windowMs <= 0) {
      return;
    }

    const cutoff = nowMs - windowMs;
    state.failures = state.failures.filter((t) => t >= cutoff);

    if (!state.blockedUntilMs && state.failures.length === 0) {
      this.states.delete(key);
    }
  }
}

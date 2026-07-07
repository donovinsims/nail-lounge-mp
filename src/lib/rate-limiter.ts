/**
 * Simple per-key sliding-window rate limiter.
 *
 * Intended as a first-line abuse guard on public endpoints (e.g.
 * createPublicBooking). Works in-memory per server process — on
 * Vercel/Nitro each cold-start gets its own window. For stricter
 * cross-instance enforcement, replace with a DB-backed limiter.
 *
 * @example
 * ```ts
 * const limiter = rateLimiter({ windowMs: 60_000, max: 5 });
 * if (!limiter.check(phone)) throw new Error("Too many requests");
 * ```
 */

interface RateLimiterConfig {
  windowMs: number;
  max: number;
}

interface Entry {
  timestamps: number[];
}

export function rateLimiter({ windowMs, max }: RateLimiterConfig) {
  const store = new Map<string, Entry>();

  // Periodically prune stale entries to avoid unbounded memory growth
  const pruneInterval = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, windowMs).unref();

  return {
    /** Returns `true` if the key is under the limit. */
    check(key: string): boolean {
      const cutoff = Date.now() - windowMs;
      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }
      // Remove expired timestamps
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length >= max) return false;
      entry.timestamps.push(Date.now());
      return true;
    },
    /** Cleanup — call on graceful shutdown if needed. */
    dispose() {
      clearInterval(pruneInterval);
      store.clear();
    },
  };
}

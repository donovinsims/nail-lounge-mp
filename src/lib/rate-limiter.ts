/**
 * DB-backed sliding-window rate limiter.
 *
 * Uses the `check_rate_limit` Postgres RPC for atomic,
 * cross-instance rate limiting. Falls open (allows request)
 * if the RPC call fails.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ key: "booking", maxRequests: 3, windowMs: 300_000 });
 * const { allowed } = await limiter.check(phone);
 * if (!allowed) throw new Error("Too many requests");
 * ```
 */

export class RateLimiter {
  private key: string;
  private maxRequests: number;
  private windowSeconds: number;

  constructor(options: { key?: string; maxRequests: number; windowMs: number }) {
    this.key = options.key ?? "default";
    this.maxRequests = options.maxRequests;
    this.windowSeconds = Math.ceil(options.windowMs / 1000);
  }

  async check(
    key?: string,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date | null }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: key ?? this.key,
      p_max_requests: this.maxRequests,
      p_window_seconds: this.windowSeconds,
    });

    if (error || !data || data.length === 0) {
      return { allowed: true, remaining: this.maxRequests, resetAt: null };
    }

    return {
      allowed: data[0].allowed,
      remaining: data[0].remaining,
      resetAt: data[0].reset_at ? new Date(data[0].reset_at) : null,
    };
  }
}

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: mockRpc,
  },
}));

describe("RateLimiter", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("allows requests under the limit", async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: true, remaining: 2, reset_at: null }],
      error: null,
    });

    const limiter = new (await import("./rate-limiter")).RateLimiter({
      maxRequests: 3,
      windowMs: 60_000,
    });
    const r1 = await limiter.check("user-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it("blocks requests over the limit", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { allowed: false, remaining: 0, reset_at: new Date(Date.now() + 60000).toISOString() },
      ],
      error: null,
    });

    const limiter = new (await import("./rate-limiter")).RateLimiter({
      maxRequests: 2,
      windowMs: 60_000,
    });
    const r3 = await limiter.check("user-1");
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.resetAt).toBeInstanceOf(Date);
  });

  it("tracks keys independently", async () => {
    // First call - allowed
    mockRpc.mockResolvedValueOnce({
      data: [{ allowed: true, remaining: 0, reset_at: null }],
      error: null,
    });
    // Second call - blocked
    mockRpc.mockResolvedValueOnce({
      data: [
        { allowed: false, remaining: 0, reset_at: new Date(Date.now() + 60000).toISOString() },
      ],
      error: null,
    });

    const limiter = new (await import("./rate-limiter")).RateLimiter({
      maxRequests: 1,
      windowMs: 60_000,
    });

    expect((await limiter.check("user-a")).allowed).toBe(true);
    expect((await limiter.check("user-a")).allowed).toBe(false);
  });

  it("uses default key when none provided", async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: true, remaining: 2, reset_at: null }],
      error: null,
    });

    const limiter = new (await import("./rate-limiter")).RateLimiter({
      key: "default-key",
      maxRequests: 3,
      windowMs: 60_000,
    });
    const r1 = await limiter.check();
    expect(r1.allowed).toBe(true);
    // Should pass the key from constructor
    expect(mockRpc).toHaveBeenCalledWith("check_rate_limit", {
      p_key: "default-key",
      p_max_requests: 3,
      p_window_seconds: 60,
    });
  });

  it("falls open on RPC error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: new Error("DB down"),
    });

    const limiter = new (await import("./rate-limiter")).RateLimiter({
      maxRequests: 3,
      windowMs: 60_000,
    });
    const result = await limiter.check("error-user");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeNull();
  });
});

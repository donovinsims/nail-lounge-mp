import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimiter } from "./rate-limiter";

describe("rateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = rateLimiter({ windowMs: 60_000, max: 3 });
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = rateLimiter({ windowMs: 60_000, max: 2 });
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = rateLimiter({ windowMs: 60_000, max: 2 });
    expect(limiter.check("user-a")).toBe(true);
    expect(limiter.check("user-a")).toBe(true);
    expect(limiter.check("user-a")).toBe(false);

    expect(limiter.check("user-b")).toBe(true);
    expect(limiter.check("user-b")).toBe(true);
    expect(limiter.check("user-b")).toBe(false);
  });

  it("allows after window expires", () => {
    const limiter = rateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(limiter.check("user-1")).toBe(true);
  });
});

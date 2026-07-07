# Test Patterns

Testing patterns and conventions for the mynails-generic project.

---

## Setup & Running Tests

The project uses **Vitest** with `globals: true` enabled.

| Command | Description |
|---|---|
| `bun run test` | Run all tests once (`vitest run`) |
| `bun run test:watch` | Run tests in watch mode (`vitest`) |

### Vitest Configuration (`vitest.config.ts`)

- **environment:** `"node"`
- **include:** `["src/**/*.test.ts", "src/**/*.test.tsx"]`
- **alias:** `@/` → `./src/` (matching tsconfig paths)
- **globals:** `true` (imports like `describe`, `it`, `expect` available via `import { ... } from "vitest"`)

> **Note on test imports:** The config sets `globals: true` so `describe`/`it`/`expect` are available globally, but all test files in this
> project explicitly import them (`import { describe, it, expect } from "vitest"`). This is the preferred style for clarity.

### CI Pipeline (`.github/workflows/ci.yml`)

The CI pipeline runs on push/PR to `main`:

1. **lint-and-typecheck** — `bun run lint` + `bun x tsc --noEmit`
2. **build** — `bun run build`

> **Note:** Tests are **not** currently run in CI. This is an improvement gap — see [Coverage Goals](#coverage-goals-and-current-status).

---

## Current Test Coverage

| File | Tests | What's Tested |
|---|---|---|
| `src/lib/booking.test.ts` | 18 | Booking Zod schemas (`createBookingSchema`, `lookupSchema`, `cancelSchema`) |
| `src/lib/admin-crud.test.ts` | 20 | Admin CRUD Zod schemas (staff create/update, service create/update, salon hours) |
| `src/lib/admin-functions.test.ts` | 9 | Staff modal Zod schemas (`completeStaffModal`) |
| `src/lib/env.test.ts` | 16 | Env helper default values + `isSeedAllowed` behavior |
| `src/lib/config.server.test.ts` | 9 | Server config (`getServerConfig`, `hasTwilio`, `hasEmail`) |
| `src/lib/rate-limiter.test.ts` | 4 | Sliding-window rate limiter class |
| **Total** | **76** | |

---

## Pattern 1: Zod Schema Validation Tests

This is the **primary testing pattern** in the project. Since schemas are defined inside server function files (and not yet extracted into a shared module), the tests replicate the schema inline.

### Canonical Pattern

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the Zod schema inline (mirroring the source file)
const mySchema = z.object({
  name: z.string().trim().min(1).max(100),
  count: z.number().int().min(0),
});

const validInput = { name: "Alice", count: 5 };

describe("mySchema", () => {
  it("accepts valid input", () => {
    const result = mySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = mySchema.safeParse({ name: "", count: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects negative count", () => {
    const result = mySchema.safeParse({ name: "Alice", count: -1 });
    expect(result.success).toBe(false);
  });
});
```

### Key Rules

1. **Always use `.safeParse()`** — never `.parse()` which throws on failure. `safeParse` returns `{ success: true, data }` or `{ success: false, error }`.
2. **Assert `.success` directly** — `expect(result.success).toBe(true)` or `expect(result.success).toBe(false)`.
3. **Assert specific error messages (optional)** — when you need to verify the right field failed:
   ```typescript
   expect(result.error?.issues[0]?.message).toBe("Required");
   ```
4. **Assert parsed/defaulted values on success** — verify default values are applied correctly:
   ```typescript
   if (result.success) {
     expect(result.data.role).toBe("staff"); // default
     expect(result.data.tipAmount).toBe(0); // default
   }
   ```
5. **Test one concern per `it`** — each test asserts a single validation rule.

### What to Cover Per Schema

- ✅ Valid input (happy path)
- ✅ Optional fields omitted
- ✅ Empty strings (for `min(1)` fields)
- ✅ Boundary values (`min(5)` → test 4 and 5; `max(100)` → test 100 and 101)
- ✅ Wrong types (string passed where number expected)
- ✅ Invalid formats (non-UUID, bad email, bad phone)
- ✅ Negative values for `min(0)` fields
- ✅ Default values applied correctly

### Example: booking.test.ts

```typescript
const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string(),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().regex(PHONE_RE),
  clientEmail: z.string().email().optional().or(z.literal("")),
});

it("accepts valid input with all fields", () => {
  const result = createBookingSchema.safeParse(validBookingData);
  expect(result.success).toBe(true);
});

it("rejects empty clientName", () => {
  const result = createBookingSchema.safeParse({
    ...validBookingData,
    clientName: "   ",
  });
  expect(result.success).toBe(false);
});
```

### Example: admin-crud.test.ts (default value assertions)

```typescript
it("accepts valid input (name only, rest get defaults)", () => {
  const result = createStaffSchema.safeParse({ name: "Alice" });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.role).toBe("staff");
    expect(result.data.workingHours).toEqual({});
    expect(result.data.avatarColor).toBe("#0a0a0a");
  }
});
```

### Example: staff modal schema (tipAmount and paymentMethod validation)

```typescript
const completeStaffModalSchema = z.object({
  bookingId: z.string().uuid(),
  tipAmount: z.number().min(0),
  paymentMethod: z.enum(["Credit/Debit", "Cash", "Venmo", "Cash App"]),
  serviceNotes: z.string().max(500).optional(),
});

it("accepts valid staff modal submission", () => {
  const result = completeStaffModalSchema.safeParse({
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    tipAmount: 15.00,
    paymentMethod: "Cash",
    serviceNotes: "Client requested extra shaping",
  });
  expect(result.success).toBe(true);
});

it("rejects invalid payment method", () => {
  const result = completeStaffModalSchema.safeParse({
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    tipAmount: 0,
    paymentMethod: "Bitcoin",
  });
  expect(result.success).toBe(false);
});

it("rejects negative tip", () => {
  const result = completeStaffModalSchema.safeParse({
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    tipAmount: -5,
    paymentMethod: "Cash",
  });
  expect(result.success).toBe(false);
});
```

---

## Pattern 2: Env Variable Mocking

Tests that validate env helper behavior (in `env.test.ts`) use a **save/restore** pattern for `process.env`.

### Simple AfterEach Cleanup

```typescript
import { describe, it, expect, afterEach } from "vitest";

describe("isSeedAllowed", () => {
  afterEach(() => {
    delete process.env.VITE_ALLOW_SEED_DATA;
  });

  it("returns false when no env set", async () => {
    const { isSeedAllowed: check } = await import("./env");
    expect(check()).toBe(false);
  });

  it("returns true when VITE_ALLOW_SEED_DATA is true", async () => {
    process.env.VITE_ALLOW_SEED_DATA = "true";
    const { isSeedAllowed: check } = await import("./env");
    expect(check()).toBe(true);
  });
});
```

### Key Points

- **`afterEach` restores/deletes** the specific env var(s) that were modified.
- **Dynamic `import()`** is used to re-evaluate modules that read env at module scope. This ensures the module re-executes its top-level code and picks up the modified env var.
- **Always clean up** env vars in `afterEach` to prevent cross-test contamination.

### Default Values (No Env Set)

For env helpers that read `import.meta.env`, the test verifies fallback values when no env variable is set:

```typescript
it("getSalonName returns default name", () => {
  expect(getSalonName()).toBe("Your Salon Name");
});

it("getSalonAddress returns empty string", () => {
  expect(getSalonAddress()).toBe("");
});
```

These tests don't need `afterEach` cleanup because they never mutate env — they just read defaults.

---

## Pattern 3: Server Config Testing

Server config (`config.server.ts`) reads `process.env` **lazily at call time** rather than at module scope. This means a static `import` works fine — no need for dynamic imports.

### Save/Restore Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest";

// All env keys touched by config.server
const ENV_KEYS = [
  "NODE_ENV",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});
```

### Testing Defaults

```typescript
it("returns defaults when no env vars are set", () => {
  const cfg = getServerConfig();
  expect(cfg.twilioAccountSid).toBe("");
  // etc.
});
```

### Testing Values

```typescript
it("reads env vars", () => {
  process.env.TWILIO_ACCOUNT_SID = "ACxxx";
  process.env.APP_URL = "https://app.example.com";

  const cfg = getServerConfig();
  expect(cfg.twilioAccountSid).toBe("ACxxx");
  expect(cfg.appUrl).toBe("https://app.example.com");
});
```

### Testing Boolean Guards (`hasTwilio`, `hasEmail`)

```typescript
it("returns false when keys not set", () => {
  expect(hasTwilio()).toBe(false);
});

it("returns true when both keys are set", () => {
  process.env.TWILIO_ACCOUNT_SID = "ACxxx";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_PHONE_NUMBER = "+15551234567";
  expect(hasTwilio()).toBe(true);
});

it("returns false when only one key is set", () => {
  process.env.TWILIO_ACCOUNT_SID = "ACxxx";
  expect(hasTwilio()).toBe(false); // auth token and phone number missing
});
```

### Why Static Import Works Here

Unlike the env helpers in Pattern 2 (which read `import.meta.env` at module scope), `getServerConfig()` and the `has*()` functions read `process.env` **at call time**. Each call re-reads the current `process.env` values, so no dynamic re-import is needed.

---

## Pattern 4: Rate Limiter Testing

The rate limiter (`rate-limiter.ts`) is a sliding-window class tested with Vitest's fake timers.

### Pattern

```typescript
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
    expect(limiter.check("user-a")).toBe(false);  // user-a blocked

    expect(limiter.check("user-b")).toBe(true);   // user-b still allowed
    expect(limiter.check("user-b")).toBe(true);
    expect(limiter.check("user-b")).toBe(false);  // now blocked too
  });

  it("allows after window expires", () => {
    const limiter = rateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.check("user-1")).toBe(true);
    expect(limiter.check("user-1")).toBe(false);

    vi.advanceTimersByTime(61_000);  // advance past window

    expect(limiter.check("user-1")).toBe(true);  // allowed again
  });
});
```

### Key Points

1. **`vi.useFakeTimers()`** in `beforeEach` to control time.
2. **Direct instantiation** — tests construct the rate limiter inline with config.
3. **Four test cases:** under limit, over limit, independent keys, window expiry.
4. **`vi.advanceTimersByTime()`** to simulate time passing.

---

## Pattern 5: What About Component / Integration Tests?

### Current Status

**No component rendering tests exist yet.** The project currently only tests:

- Zod schema validation (business logic validation)
- Env/config helpers (string defaults, boolean guards)
- Rate limiter (time-dependent logic)

### Future Work

Areas to add test coverage:

| Area | Suggested Approach | Priority |
|---|---|---|
| **Component rendering** | Vitest + `@testing-library/react` + `jsdom` environment | Medium |
| **Server function logic** | Integration tests calling server functions with mocked Twilio/Resend | Low |
| **Auth middleware** | Unit tests for `requireSupabaseAuth` with mocked request context | Medium |
| **Slot availability** | Unit tests for `computeAvailableSlots` edge cases | Medium |
| **Staff modal flow** | Integration test for `completeStaffModal` + `getPendingCompletions` chain | Medium |
| **Twilio rating loop** | Integration test for `sendRatingSms` + `handleRatingReply` branching | Low |
| **Twilio SMS / Resend email** | Mock external SDKs, test that correct payloads are sent | Low |
| **E2E booking flow** | Playwright or similar browser testing | Low |

### To Add Component Tests in the Future

1. Add `@testing-library/react` and `@testing-library/jest-dom` as dev dependencies.
2. Add a separate Vitest config for `jsdom` environment (or use a project reference).
3. Follow the same `safeParse`-like pattern for form validation tests within components.

---

## Test Organization Conventions

### File Naming

- Test files mirror source files: `src/lib/booking.test.ts` tests `src/lib/booking.functions.ts`.
- Tests live **alongside** source code, not in a separate `__tests__` directory.
- Suffix: `.test.ts` or `.test.tsx`.

### Describe / It Structure

- **Outer `describe`:** matches the exported function or schema name (e.g., `describe("createBookingSchema")`).
- **Inner `it`:** describes the specific behavior, starting with "accepts", "rejects", or "allows".
- **Group by schema/function** — each schema or function gets its own `describe` block.

### Import Style

```typescript
// Always import from vitest explicitly (even with globals: true)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { z } from "zod";
import { getServerConfig, hasTwilio } from "./config.server";
```

### Whitespace

- Use comment separators (`// ----`) between schema definitions and tests.
- Use comment separators between different schema groups within a file.
- Group shared valid data at the top of the file.

---

## Coverage Goals and Current Status

| Metric | Current | Target |
|---|---|---|
| Total tests | 76 | 100+ |
| Zod schema coverage | All schemas with `z.object()` validated | 100% of input schemas |
| Env/config coverage | Full | Maintain |
| Rate limiter coverage | Full | Maintain |
| Component coverage | 0% | ≥ 50% of UI components |
| CI test execution | ❌ Not run in CI | ✅ Added to CI workflow |

### Immediate Gaps

1. **CI doesn't run tests** — the `.github/workflows/ci.yml` pipeline has `lint-and-typecheck` and `build` jobs but no `test` job. Adding one is the highest-priority improvement.
2. **No barrier to merging broken tests** — since tests aren't in CI, nothing prevents merging a PR that breaks existing tests.

### Suggested CI Improvement

Add a `test` job to `ci.yml`:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest
    - run: bun install --frozen-lockfile
    - run: bun run test
```

---

## Summary Checklist for Adding New Tests

- [ ] Place test file at `src/lib/<module>.test.ts` alongside the source
- [ ] Import `describe, it, expect` (and `vi` for timers) from vitest
- [ ] For Zod schemas: replicate the schema inline, use `.safeParse()`, assert `.success`
- [ ] For env-dependent code: save/restore env vars in `beforeEach`/`afterEach`
- [ ] For lazy-read config: static import works; save/restore `process.env`
- [ ] For time-dependent code: use `vi.useFakeTimers()` + `vi.advanceTimersByTime()`
- [ ] Cover: valid inputs, invalid inputs, boundary values, default values, edge cases
- [ ] Run `bun run test` before pushing

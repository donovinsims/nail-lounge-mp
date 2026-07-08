# Technical Debt Implementation Plan

> Plan: Phase 0–5, ordered by dependency and impact.
> Status tracking: ✅ complete, 🔄 in progress, ⬜ pending

---

## Phase 0 — Credential Hardening & Security (Today)

**No rotation — the platform isn't public. But lock down what's on disk.**

### 0.1 Harden `.env` file permissions

```bash
# Restrict .env to owner-only read/write
chmod 600 .env .env.vercel
```

### 0.2 Add credential warning headers to `.env` and `.env.vercel`

**File: `.env`** — Add at top:

```bash
# ═══════════════════════════════════════════════════════════════
# WARNING: This file contains LIVE credentials.
# DO NOT commit, screenshot, screen-share, or paste.
# The platform is pre-launch but these are real secrets.
# Restrict access: chmod 600 .env
# ═══════════════════════════════════════════════════════════════
```

**File: `.env.vercel`** — Same header.

### 0.3 Strip hardcoded Supabase project URL from `.env.example`

**File: `.env.example`** — Replace:

```diff
- VITE_SUPABASE_URL="https://ecqztajukteergupvrkg.supabase.co"
- SUPABASE_URL="https://ecqztajukteergupvrkg.supabase.co"
- SUPABASE_PROJECT_ID="ecqztajukteergupvrkg"
- VITE_SUPABASE_PROJECT_ID="ecqztajukteergupvrkg"
+ VITE_SUPABASE_URL="<your-supabase-project-url>"
+ SUPABASE_URL="<your-supabase-project-url>"
```

### 0.4 Sync `.env.example` with `.env.template` (all missing vars)

**File: `.env.example`** — Append missing variables from `.env.template`:

```
# ── Salon Details ──────────────────────────────────────────────
VITE_SALON_ID="<your-salon-uuid>"
VITE_SALON_NAME="<your-salon-name>"
VITE_SALON_ADDRESS="<your-salon-address>"
VITE_SALON_PHONE="<your-salon-phone>"
VITE_SALON_TAGLINE="<your-salon-tagline>"
VITE_OG_IMAGE="<og-image-url>"
VITE_SALON_EMAIL="<your-email>"
VITE_SALON_MAPS_URL="<google-maps-url>"
VITE_SALON_MAP_EMBED="<maps-embed-url>"
VITE_SALON_INSTAGRAM="<instagram-url>"
VITE_SALON_FACEBOOK="<facebook-url>"
VITE_SALON_TIKTOK="<tiktok-url>"
VITE_SALON_YELP="<yelp-url>"
VITE_TWILIO_PHONE_NUMBER="<twilio-phone>"

# ── App URL (required for Twilio webhooks) ─────────────────────
VITE_APP_URL="<your-app-url>"

# ── Twilio (server-side) ───────────────────────────────────────
TWILIO_ACCOUNT_SID="<your-twilio-sid>"
TWILIO_AUTH_TOKEN="<your-twilio-auth-token>"
TWILIO_PHONE_NUMBER="<your-twilio-phone>"
GOOGLE_REVIEW_URL="<google-review-link>"

# ── Email (Resend) ─────────────────────────────────────────────
RESEND_API_KEY="<your-resend-api-key>"
RESEND_FROM_EMAIL="<from-email>"

# ── Analytics (Umami) ──────────────────────────────────────────
VITE_UMAMI_WEBSITE_ID="<umami-id>"
VITE_UMAMI_HOST="<umami-host>"

# ── Seed Data ──────────────────────────────────────────────────
VITE_ALLOW_SEED_DATA="false"
```

### 0.5 Add pre-push secret detection hook

**File: `scripts/check-secrets.sh`** (new):

```bash
#!/bin/bash
# Pre-push hook: block if any staged file contains a known live key pattern.

BLOCKED_PATTERNS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "TWILIO_AUTH_TOKEN"
  "VERCEL_OIDC_TOKEN"
)

for file in $(git diff --cached --name-only); do
  for pattern in "${BLOCKED_PATTERNS[@]}"; do
    if grep -q "$pattern" "$file" 2>/dev/null; then
      echo "❌ BLOCKED: $file contains '$pattern'"
      echo "   Rotate the key and remove it from version control."
      exit 1
    fi
  done
done
```

Then install via package.json script (done in Phase 1: `husky`).

### 0.6 Verify `.gitignore` is airtight

**File: `.gitignore`** — Confirm these entries exist (they do):

```
.env
.env.*.local
.env.vercel
```

✅ Already correct — no action needed.

---

## Phase 1 — Quality Gates (Sprint 1)

### 1.1 Fix the failing test

**File: `src/lib/env.test.ts`** — Line 72–74. The test expects `undefined` but `.env` sets `VITE_SALON_ID`:

```diff
- it("getSalonId returns undefined when no env set", () => {
-   expect(getSalonId()).toBeUndefined();
+ it("getSalonId returns the env value when set", () => {
+   const id = getSalonId();
+   expect(typeof id).toBe("string");
+   expect(id).toMatch(/^[0-9a-f-]+$/i);
+ });
```

### 1.2 Harden ESLint — Catch type escapes at build time

**File: `eslint.config.js`**:

```diff
- "@typescript-eslint/no-explicit-any": "warn",
+ "@typescript-eslint/no-explicit-any": "error",
```

This immediately makes `bun run lint` fail on any of the 65 source `any` escapes.

**Temporary companion rule** — Add this to keep `no-unused-vars` off (TanStack Start patterns) but catch unused imports:

```diff
  "@typescript-eslint/no-unused-vars": "off",
+ "@typescript-eslint/no-floating-promises": "error",
```

### 1.3 Add CI test job

**File: `.github/workflows/ci.yml`** — Add a `test` job:

```diff
+ test:
+   runs-on: ubuntu-latest
+   steps:
+     - uses: actions/checkout@v4
+     - uses: oven-sh/setup-bun@v2
+       with:
+         bun-version: latest
+     - run: bun install --frozen-lockfile
+     - run: bun run test
```

Also add `needs: [lint-and-typecheck]` to the build job so build only runs after lint+typecheck passes.

### 1.4 Extract shared error handler

**File: `src/lib/handle-error.ts`** (new):

```typescript
/**
 * Typed error handler for server functions and route loaders.
 * Replaces the `catch(e: any)` → `console.error` → `setError` pattern
 * duplicated across 10+ locations.
 */

export interface ErrorResult {
  message: string;
  code?: string;
}

export function handleError(error: unknown, context: string): ErrorResult {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";

  console.error(`[${context}]`, error);

  return { message, code: error instanceof Error ? error.name : undefined };
}

/**
 * Wraps a server function handler with consistent error handling.
 */
export async function withErrorHandler<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const result = handleError(error, context);
    throw new Error(result.message);
  }
}
```

Then replace each `catch(e: any)` block across 6 files with:

```typescript
catch (error) {
  handleError(error, "admin-settings:staff-update");
}
```

### 1.5 Install Husky + lint-staged

```bash
bun add --dev husky lint-staged
bun x husky init
```

**File: `.husky/pre-commit`**:

```bash
npx lint-staged
```

**File: `package.json`** — Add `lint-staged` config:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

**File: `.husky/pre-push`**:

```bash
bun run test
bun run lint
bun x tsc --noEmit
```

---

## Phase 2 — Type Safety (Sprint 1)

### 2.1 Move formatters to `utils.ts`

**File: `src/lib/utils.ts`** — Append:

```typescript
export function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
```

**File: `src/lib/salon.ts`** — Remove lines 93–109 (the 3 formatter functions) and add:

```diff
- export function fmtMoney(n: number) { ... }
- export function fmtTime(d: Date | string) { ... }
- export function fmtDate(d: Date | string) { ... }
```

**Update all 10+ consumers** — Change imports from `@/lib/salon` to `@/lib/utils`:

| File                                               | Current Import                                | New Import   |
| -------------------------------------------------- | --------------------------------------------- | ------------ |
| `src/routes/appointments.tsx`                      | `{ fmtMoney, fmtTime, fmtDate }` from `salon` | from `utils` |
| `src/routes/services.tsx`                          | `{ fmtMoney }` from `salon`                   | from `utils` |
| `src/routes/book.tsx`                              | all 3 from `salon`                            | from `utils` |
| `src/routes/_authenticated/-admin-dashboard.tsx`   | `{ fmtMoney, fmtTime }` from `salon`          | from `utils` |
| `src/routes/_authenticated/-admin-commissions.tsx` | `{ fmtMoney, fmtDate }` from `salon`          | from `utils` |
| `src/routes/_authenticated/-admin-calendar.tsx`    | `{ fmtTime }` from `salon`                    | from `utils` |
| `src/routes/_authenticated/-admin-calls.tsx`       | `{ fmtDate }` from `salon`                    | from `utils` |
| `src/routes/_authenticated/-admin-alerts.tsx`      | `{ fmtDate }` from `salon`                    | from `utils` |

**Fix prop-drilling in booking sub-components:**

- `src/routes/book/-step-confirm.tsx` — Import `fmtTime`, `fmtDate` from `@/lib/utils` directly instead of receiving as props
- `src/routes/book/-booking-summary.tsx` — Import all 3 formatters from `@/lib/utils` directly instead of receiving as props
- `src/routes/book.tsx` — Stop passing formatters as props to those sub-components

### 2.2 Type admin routes with Database type

**Pattern for all 82 `any` escapes** — In each admin sub-view file:

```diff
+ import type { Database } from "@/integrations/supabase/types";
+ type Booking = Database["public"]["Tables"]["bookings"]["Row"];
+ type Staff = Database["public"]["Tables"]["staff"]["Row"];

  // Replace:
- supabase.from("bookings").select("*").then(({ data }) =>
-   data?.map((b: any) => ({ ...b }))
+ supabase.from("bookings").select("*").then(({ data }) =>
+   data?.map((b: Booking) => ({ ...b }))
```

**Per-file typing plan**:

| File                     | `any` count | Primary types needed                   |
| ------------------------ | ----------- | -------------------------------------- |
| `-admin-dashboard.tsx`   | 19          | `Booking`, `CommissionRecord`, `Staff` |
| `-admin-settings.tsx`    | 10          | `Staff`, `Service`, `SalonHours`       |
| `-admin-calendar.tsx`    | 11          | `Booking`, `Staff`                     |
| `-admin-commissions.tsx` | 5           | `CommissionRecord`, `Booking`          |
| `admin.tsx`              | 6           | `Staff`, `Profile`, `OwnerAlert`       |
| `-admin-waitlist.tsx`    | 2           | `WaitlistEntry`                        |
| `-admin-calls.tsx`       | 1           | `AiCall`                               |
| `-admin-alerts.tsx`      | 3           | `OwnerAlert`                           |
| `-admin-floor.tsx`       | 1           | `FloorStatus`                          |
| `services.tsx`           | 2           | `Service`                              |
| `appointments.tsx`       | 1           | `Booking`                              |
| `auth.tsx`               | 1           | `AuthError`                            |
| `index.tsx`              | 3           | `Service`, `Staff`                     |
| `book.tsx`               | 1           | `BookingSearch`                        |
| `admin.functions.ts`     | 3           | `Booking`, `Staff`                     |

### 2.3 Fix the `as unknown as` double-cast

**File: `src/routes/_authenticated/staff/index.tsx:44`**:

```diff
- const pendingList = bookings as unknown as PendingBooking[];
+ // Type the server function return or add a proper typed wrapper
+ const pendingList = (bookings ?? []) as PendingBooking[];
```

Better: Create a typed wrapper around `getPendingCompletions` that returns `PendingBooking[]` instead of the inline cast.

---

## Phase 3 — Test Infrastructure (Sprint 2)

### 3.1 Export Zod schemas from source modules

**File: `src/lib/booking.functions.ts`** — Extract and export each schema:

```diff
+ export const createBookingSchema = z.object({ ... });
+ export const lookupSchema = z.object({ ... });
+ export const cancelSchema = z.object({ ... });
+ export const completeStaffModalSchema = z.object({ ... });
+ export const staffQuerySchema = z.object({ ... });

  export const createPublicBooking = createServerFn({ method: "POST" })
-   .inputValidator((d) => z.object({ ... }).parse(d))
```

**File: `src/lib/admin-crud.functions.ts`** — Same: export schemas.

**File: `src/lib/admin.functions.ts`** — Same: export `completeStaffModalSchema` and `staffQuerySchema`.

**File: `src/lib/booking.test.ts`** — Replace the 5 duplicated schema definitions with:

```diff
- const createBookingSchema = z.object({ ... });
- const lookupSchema = z.object({ ... });
+ import {
+   createBookingSchema,
+   lookupSchema,
+   cancelSchema,
+   completeStaffModalSchema,
+   staffQuerySchema,
+ } from "./booking.functions";
```

**File: `src/lib/admin-crud.test.ts`** — Same: import schemas from source.

**File: `src/lib/admin-functions.test.ts`** — Same: import schemas from source.

### 3.2 Add integration tests for booking logic

**File: `src/lib/booking.integration.test.ts`** (new):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase and external services
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
          order: vi.fn(() => ({ limit: vi.fn() })),
        })),
        lt: vi.fn(() => ({ gt: vi.fn() })),
        gt: vi.fn(() => ({})),
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
        update: vi.fn(() => ({ eq: vi.fn() })),
        is: vi.fn(() => ({ lte: vi.fn(() => ({ order: vi.fn() })) })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

describe("createPublicBooking", () => {
  it("rejects when rate limited", async () => {
    // Mock rate limiter check to return false
    // Expect error: "Too many booking attempts..."
  });

  it("rejects when service not found", async () => {
    // Mock service lookup to return empty
  });

  it("rejects when slot is conflicted", async () => {
    // Mock conflict check to find overlapping booking
  });

  it("creates booking successfully and sends SMS+email", async () => {
    // Full success path
  });

  it("handles Twilio SMS failure gracefully", async () => {
    // SMS throws → booking still created, no crash
  });
});
```

### 3.3 Add vitest ESLint plugin

```bash
bun add --dev eslint-plugin-vitest
```

**File: `eslint.config.js`**:

```diff
+ import vitest from "eslint-plugin-vitest";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
+     vitest,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
+     ...vitest.configs.recommended.rules,
    },
  },
);
```

---

## Phase 4 — Code Refactoring (Sprints 2–3)

### 4.1 Decompose `createPublicBooking` (130 lines → 5 functions)

**File: `src/lib/booking-validators.ts`** (new):

```typescript
import { z } from "zod";

export const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

export const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string(),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().regex(PHONE_RE),
  clientEmail: z.string().email().optional().or(z.literal("")),
});

// (move other schemas here too)
```

**File: `src/lib/booking-service.ts`** (new):

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface LookupResult {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_after_minutes: number | null;
  salon_id: string;
}

/** Validate service exists and belongs to salon */
export async function lookupService(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  salonId: string,
): Promise<LookupResult> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, buffer_after_minutes, salon_id")
    .eq("id", serviceId)
    .eq("salon_id", salonId)
    .maybeSingle();
  if (error || !data) throw new Error("Service not found");
  return data;
}
```

**File: `src/lib/booking-notifications.ts`** (new):

```typescript
/** Send SMS confirmation for a new booking */
export async function sendBookingSms(
  phone: string,
  salonName: string,
  serviceName: string,
  startTime: Date,
): Promise<void> {
  /* extracted from booking.functions.ts */
}

/** Send email confirmation */
export async function sendBookingEmail(email: string, details: BookingEmailDetails): Promise<void> {
  /* extracted */
}
```

**File: `src/lib/booking.functions.ts`** — Refactored `createPublicBooking`:

```typescript
.handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Rate limit check
  const { allowed } = await bookingRateLimiter.check(data.clientPhone);
  if (!allowed) throw new Error("Too many booking attempts. Please try again later.");

  // 2. Validate service availability
  const service = await lookupService(supabaseAdmin, data.serviceId, data.salonId);

  // 3. Check slot conflicts
  await assertSlotAvailable(supabaseAdmin, data.staffId, data.startTime, service);

  // 4. Upsert client
  const clientId = await upsertClient(supabaseAdmin, data);

  // 5. Create booking
  const booking = await insertBooking(supabaseAdmin, data, clientId, service);

  // 6. Send notifications (fire-and-forget)
  notifyBookingCreated(supabaseAdmin, data, booking, service);

  return { bookingId: booking.id };
});
```

### 4.2 Decompose `book.tsx` (496 lines)

**File: `src/routes/book/-use-booking-flow.ts`** (new) — Extract the booking step state machine:

```typescript
export type BookingStep = "service" | "staff" | "datetime" | "confirm" | "done";
export type BookingFlowState = {
  step: BookingStep;
  serviceId?: string;
  staffId?: string;
  startTime?: string;
  // ...
};

export function useBookingFlow() {
  const [state, setState] = useState<BookingFlowState>({ step: "service" });

  const goTo = (step: BookingStep) => setState((s) => ({ ...s, step }));
  const setData = (partial: Partial<BookingFlowState>) => setState((s) => ({ ...s, ...partial }));

  return { state, goTo, setData };
}
```

**File: `src/routes/book.tsx`** — Use the hook, reduce to orchestration only:

```typescript
function BookPage() {
  const flow = useBookingFlow();

  return (
    <div>
      {flow.state.step === "service" && <StepService onSelect={(id) => { flow.setData({ serviceId: id }); flow.goTo("staff"); }} />}
      {flow.state.step === "staff" && <StepStaff onSelect={(id) => { ... }} />}
      {/* ... */}
    </div>
  );
}
```

### 4.3 Consolidate `-admin-dashboard.tsx` queries (492 lines)

Replace 6 separate `useQuery` calls with a single aggregate query or `useQueries`:

```typescript
const queries = useQueries({
  queries: [
    { queryKey: ["bookings", date], queryFn: () => fetchBookings(date) },
    { queryKey: ["commission", date], queryFn: () => fetchCommissions(date) },
    // ...consolidate related queries
  ],
});
```

Or use a single server function that returns all dashboard data in one round trip:

```typescript
export const getDashboardData = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [bookings, commissions, staff, alerts] = await Promise.all([
      supabaseAdmin.from("bookings").select(...),
      supabaseAdmin.from("commission_records").select(...),
      supabaseAdmin.from("staff").select(...),
      supabaseAdmin.from("owner_alerts").select(...),
    ]);
    return { bookings: bookings.data, commissions: commissions.data, ... };
  });
```

---

## Phase 5 — Documentation & Infrastructure (Ongoing)

### 5.1 Add `README.md`

**File: `README.md`** (new, top-level):

```markdown
# nail-lounge-mp

Multi-tenant salon appointment platform built with TanStack Start + Supabase.

## Architecture

- **Framework:** TanStack React Start (SSR + file-based routing)
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** Supabase Auth (email OTP)
- **SMS:** Twilio
- **Email:** Resend
- **Deployment:** Vercel (serverless)

## Quick Start

1. Copy `.env.example` to `.env` and fill in your credentials
2. Run `bun install`
3. Run `bun run dev`
4. Open http://localhost:3000

See `docs/onboarding-new-salon.md` for full deployment guide.

## Commands

| Command          | Description        |
| ---------------- | ------------------ |
| `bun dev`        | Development server |
| `bun build`      | Production build   |
| `bun test`       | Run tests          |
| `bun run lint`   | Lint check         |
| `bun run format` | Auto-format        |

## Project Structure
```

src/
routes/ # File-based routing (TanStack Start)
lib/ # Business logic + server functions
components/ # UI components (shadcn/ui + custom)
integrations/ # Supabase client + types
docs/ # Architecture, deployment, and onboarding docs

```

## Key Documents

- `docs/ARCHITECTURE.md` — Architecture decisions, data model, ADRs
- `docs/TECHNICAL_SPEC.md` — Full technical specification
- `AGENTS.md` — AI-friendly project overview for coding agents
```

### 5.2 Add `CHANGELOG.md`

**File: `CHANGELOG.md`** (new):

```markdown
# Changelog

## [Unreleased]

### Technical Debt Remediation

- ESLint hardening: `no-explicit-any` set to error
- Credential security: restricted file permissions, pre-push secret detection
- Test infrastructure: CI test job, schema import fix, failing test fixed
- Code quality: shared error handler, formatters moved to utils.ts
- Documentation: README.md, CHANGELOG.md added

## [Pivot] — 2026-07-06

See `CHANGES-6-7-26.MD` for the Stripe→in-store payment pivot log.
```

### 5.3 Add Sentry monitoring

```bash
bun add @sentry/node @sentry/react @sentry/vite
```

**File: `src/lib/monitoring.ts`** (new):

```typescript
import * as Sentry from "@sentry/react";

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
    });
  }
}
```

**File: `src/start.ts`** — Add:

```typescript
import { initSentry } from "./lib/monitoring";
initSentry();
```

### 5.4 Clean up `.then()` promise chains

| File                                              | Lines                                     | Convert To                     |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| `src/routes/auth/callback.tsx:11`                 | `.then(({ data }) => navigate(...))`      | `const { data } = await ...`   |
| `src/routes/_authenticated/admin.tsx:90`          | `supabase.auth.getUser().then(...)`       | `const { data } = await ...`   |
| `src/routes/_authenticated/admin.tsx:100`         | `.then(() => qc.invalidateQueries(...))`  | `await qc.invalidateQueries()` |
| `src/routes/_authenticated/staff/index.tsx:36,43` | Two chained `.then()`                     | `await` pattern                |
| `src/lib/booking.functions.ts:258`                | `.then(async ({ sendRatingSms }) => ...)` | Extract, use `await`           |

### 5.5 Add `CONTRIBUTING.md`

**File: `CONTRIBUTING.md`** (new):

```markdown
# Contributing

## Before You Start

- Read `AGENTS.md` and `docs/ARCHITECTURE.md`
- Ensure `bun test` passes
- Ensure `bun run lint` has no errors

## Code Standards

- **TypeScript:** Never use `any`. Use the Supabase `Database` type.
- **Zod schemas:** Define in source files and export. Tests import from source.
- **Error handling:** Use `handleError()` from `src/lib/handle-error.ts`.
- **Server functions:** Use `async/await`, never `.then()` chains.
- **Formatting:** Prettier with 100 print width and double quotes.

## Pull Request Checklist

- [ ] No new `any` type escapes
- [ ] Tests included for new logic
- [ ] `bun run test` passes
- [ ] `bun run lint` passes
- [ ] `bun x tsc --noEmit` passes
```

---

## Implementation Order (Dependency Map)

```
Phase 0 (Today)
  ├── 0.1 chmod 600 .env/.env.vercel
  ├── 0.2 Warning headers in .env files
  ├── 0.3 Fix .env.example (strip hardcoded URL)
  ├── 0.4 Sync .env.example with .env.template
  └── 0.5 Add scripts/check-secrets.sh

Phase 1 (Sprint 1)
  ├── 1.1 Fix failing test
  ├── 1.2 Harden ESLint (no-explicit-any: error)
  ├── 1.3 Add CI test job
  ├── 1.4 Create shared error handler → blocks: fixes 10 catch blocks
  └── 1.5 Install Husky + lint-staged

Phase 2 (Sprint 1—overlaps Phase 1 for typing)
  ├── 2.1 Move formatters to utils.ts → blocks: fix 10+ imports + prop-drilling
  ├── 2.2 Type all admin routes (65 `any` escapes)
  └── 2.3 Fix as unknown as double-cast

Phase 3 (Sprint 2)
  ├── 3.1 Export schemas from source → blocks: test imports fix
  ├── 3.2 Add integration tests for booking
  └── 3.3 Add vitest ESLint plugin

Phase 4 (Sprints 2–3, can parallel with Phase 3)
  ├── 4.1 Decompose createPublicBooking (130→5 functions)
  ├── 4.2 Decompose book.tsx (extract useBookingFlow hook)
  └── 4.3 Consolidate admin dashboard queries

Phase 5 (Ongoing, can parallel with anything)
  ├── 5.1 README.md
  ├── 5.2 CHANGELOG.md
  ├── 5.3 Sentry monitoring
  ├── 5.4 Clean up .then() chains
  └── 5.5 CONTRIBUTING.md
```

---

## Summary of Files Changed

| File                                             | Action                                            | Phase         |
| ------------------------------------------------ | ------------------------------------------------- | ------------- |
| `.env`                                           | Add warning header                                | 0.2           |
| `.env.vercel`                                    | Add warning header                                | 0.2           |
| `.env.example`                                   | Strip hardcoded URL, sync with template           | 0.3–4         |
| `scripts/check-secrets.sh`                       | NEW — pre-push secret detection                   | 0.5           |
| `src/lib/env.test.ts`                            | Fix failing test                                  | 1.1           |
| `eslint.config.js`                               | Hardened rules                                    | 1.2, 3.3      |
| `.github/workflows/ci.yml`                       | Add test job                                      | 1.3           |
| `src/lib/handle-error.ts`                        | NEW — shared error handler                        | 1.4           |
| `src/routes/_authenticated/-admin-settings.tsx`  | Replace catch blocks                              | 1.4           |
| `src/routes/_authenticated/-admin-dashboard.tsx` | Replace catch blocks + type + consolidate queries | 1.4, 2.2, 4.3 |
| `src/routes/auth.tsx`                            | Replace catch block                               | 1.4           |
| `src/routes/_authenticated/-admin-alerts.tsx`    | Replace catch block                               | 1.4           |
| `.husky/pre-commit`                              | NEW                                               | 1.5           |
| `.husky/pre-push`                                | NEW                                               | 1.5           |
| `package.json`                                   | Add lint-staged config                            | 1.5           |
| `src/lib/utils.ts`                               | Add formatters                                    | 2.1           |
| `src/lib/salon.ts`                               | Remove formatters                                 | 2.1           |
| `src/routes/*` (10+ files)                       | Update import paths                               | 2.1           |
| `src/routes/book/-step-confirm.tsx`              | Direct imports instead of props                   | 2.1           |
| `src/routes/book/-booking-summary.tsx`           | Direct imports instead of props                   | 2.1           |
| `src/routes/book.tsx`                            | Stop prop-drilling formatters                     | 2.1           |
| `src/routes/_authenticated/*` (9+ files)         | Type `any` → `Database` rows                      | 2.2           |
| `src/routes/_authenticated/staff/index.tsx`      | Fix double-cast                                   | 2.3           |
| `src/lib/booking.functions.ts`                   | Export schemas, decompose handler                 | 3.1, 4.1      |
| `src/lib/admin-crud.functions.ts`                | Export schemas                                    | 3.1           |
| `src/lib/admin.functions.ts`                     | Export schemas                                    | 3.1           |
| `src/lib/booking.test.ts`                        | Import schemas from source                        | 3.1           |
| `src/lib/admin-crud.test.ts`                     | Import schemas from source                        | 3.1           |
| `src/lib/admin-functions.test.ts`                | Import schemas from source                        | 3.1           |
| `src/lib/booking.integration.test.ts`            | NEW — integration tests                           | 3.2           |
| `src/lib/booking-validators.ts`                  | NEW — extracted schemas                           | 4.1           |
| `src/lib/booking-service.ts`                     | NEW — extracted service layer                     | 4.1           |
| `src/lib/booking-notifications.ts`               | NEW — extracted notification logic                | 4.1           |
| `src/routes/book/-use-booking-flow.ts`           | NEW — booking step state machine                  | 4.2           |
| `README.md`                                      | NEW — top-level project readme                    | 5.1           |
| `CHANGELOG.md`                                   | NEW — change log                                  | 5.2           |
| `CONTRIBUTING.md`                                | NEW — contributing guide                          | 5.5           |
| `src/lib/monitoring.ts`                          | NEW — Sentry setup                                | 5.3           |
| `src/start.ts`                                   | Add Sentry init                                   | 5.3           |
| `src/routes/auth/callback.tsx`                   | `.then()` → `async/await`                         | 5.4           |

**Total: ~30 existing files modified + ~10 new files created**
**Estimated effort: 110–140 hours** (spread across 3–4 sprints)
**Priority order:** Phase 0 (immediate) → Phase 1 (blocks everything else) → Phase 2+3 (parallel) → Phase 4 → Phase 5

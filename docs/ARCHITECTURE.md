# Architecture Reference — nail-lounge

> A production-ready, generic salon management platform built with TanStack Start + Supabase.
> Zero hardcoded branding — all salon-specific values come from centralized env helpers.

---

## Current Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  TanStack Router · React 19 · Tailwind v4 · shadcn/ui (new-york) │
└──────────────┬───────────────────────────────────┬───────────────┘
               │ SSR / Hydration                   │ Server Function
               ▼                                   ▼ (RPC)
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   TanStack Start (Nitro)     │    │   createServerFn Handlers    │
│   Vite 7 · Vercel/CF target  │◄───│   Zod validation · Auth MW   │
│   src/server.ts · start.ts   │    │   src/lib/*.functions.ts     │
└──────────────┬───────────────┘    └──────────┬───────────────────┘
               │                                │
               │  Dynamic import                │  supabaseAdmin or
               ▼  (service role)                ▼  auth-context client
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                            │
│  auth.users · profiles · salons · staff · services · clients     │
│  bookings · commission_records · waitlist_entries · floor_status │
│  ai_calls · owner_alerts · RLS · RPCs (get_busy_slots)          │
└──────────────────────────────────────────────────────────────────┘
               │
               ├── Twilio (SMS notifications + 1-5 rating loop)
               ├── Resend (Email confirmations)
               └── Umami (Analytics, client-side)
```

---

## Architecture Flow — Request Lifecycle

```
Browser ──► TanStack Start SSR
  │
  ├── Route match (file-based routing, src/routes/)
  ├── SSR render (React 19 server components NOT used — standard React)
  ├── Hydration on client
  │
  ├── Data fetching (useQuery + useSuspenseQuery)
  │     └── Supabase anon client (public reads: services, staff, slots)
  │
  └── Mutations (createServerFn POST)
        ├── Public: createPublicBooking
        │     ├── Zod input validation
        │     ├── Rate limiter check (3 req / 5 min per phone)
        │     ├── supabaseAdmin (dynamic import, service role bypasses RLS)
        │     ├── Slot conflict check (get_busy_slots RPC)
        │     ├── Client upsert + Booking insert (confirmed status directly)
        │     ├── Twilio SMS (soft-fail)
        │     └── Resend email (soft-fail)
        │
        ├── Staff: completeStaffModal
        │     ├── Writes payment_method, tip_amount, service_notes
        │     ├── Sets completed_at = NOW()
        │     ├── Triggers Twilio 1-5 rating SMS to client
        │     └── Returns success (modal dismissed)
        │
        └── Authenticated: admin CRUD
              ├── requireSupabaseAuth middleware
              ├── Auth-context supabase client (respects RLS)
              └── All queries filter by SALON_ID from env var
```

---

## Architecture Decision Records

### ADR-001: TanStack Start over Next.js

**Context:** The project needed a React framework with SSR, file-based routing, and a simple mental model. Next.js introduced App Router complexity (RSC, layout.tsx, server actions vs API routes) that added cognitive overhead for what is fundamentally a CRUD-heavy booking app.

**Decision:** Use `@tanstack/react-start` with Vite 7, Nitro server engine (Vercel/Cloudflare target), and standard React (no RSC). Routes live as individual files in `src/routes/`. Shared views use dash-prefixed files (`-admin-dashboard.tsx`) imported by parent routes — no nested layout.tsx pattern.

**Consequences:**

- Simpler route model — one file per route, explicit `<Outlet />`
- Vite-native dev experience (HMR, plugin ecosystem)
- Nitro enables Cloudflare Workers deployment without adapter hacks
- Smaller ecosystem vs Next.js — fewer community examples, documentation thinner
- No isomorphic `fetch` replacement — use `supabase` client directly
- Server functions (`createServerFn`) replace both Next.js API routes and Server Actions

### ADR-002: Single-Tenant Isolation via Env Var

**Context:** The platform serves multiple independent salons. Early exploration considered multi-tenant SaaS (tenant_id column + RLS policies filtering by tenant). This added complexity: cross-tenant data bleed risk, per-tenant configuration tables, and harder debugging.

**Decision:** Each salon gets its own deployment. `SALON_ID` (via `VITE_SALON_ID`) is set as an environment variable at deploy time. Every database query filters by this value — no multi-tenant branching logic. RLS still operates per-table but cross-tenant concerns are eliminated architecturally.

**Consequences:**

- Absolute isolation — no tenant can access another's data even if RLS is misconfigured
- Simple mental model: one deployment = one salon
- Requires CI/CD per salon (GitHub Actions matrix or manual deploy per instance)
- Supabase project can be shared (with separate schemas/IDs) or dedicated per salon
- Seed data loaded per salon ID with explicit isolation verified in tests
- Env vars per deployment managed via `.env.template` as source of truth

### ADR-003: Server Functions over REST Endpoints

**Context:** Traditional full-stack React apps build a REST or GraphQL API layer, then consume it from the frontend. This adds boilerplate (route handlers, serialization, client generation) and fragments type safety across the network boundary.

**Decision:** Use TanStack Start's `createServerFn` for all data mutations. No separate API router. Input validation via Zod `.parse()` calls inside server function handlers. Public server functions use `supabaseAdmin` (service role, imported dynamically). Authenticated server functions use `requireSupabaseAuth` middleware that validates the bearer token and provides an auth-context client respecting RLS.

**Consequences:**

- Eliminates API route files — backend logic colocated with application concerns
- Full type safety from Zod to database without codegen
- Server functions are tree-shakable — only bundled if imported
- Auth middleware removes boilerplate per endpoint
- Webhook endpoints (Twilio) still use standard route handlers in `src/routes/api/`
- Debugging requires understanding TanStack Start's RPC serialization

### ADR-004: Env Var Convention (VITE* vs Non-VITE*)

**Context:** Vite exposes `import.meta.env.VITE_*` variables to client bundles. Secrets must never ship to the browser. Cloudflare Workers resolve env vars per-request, not at module load time.

**Decision:**

- `VITE_` prefix: public env vars exposed to client bundles (`VITE_SUPABASE_URL`, `VITE_APP_URL`, `VITE_SALON_ID`, `VITE_UMAMI_*`)
- Non-`VITE_` prefix: server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_*`, `RESEND_API_KEY`)
- Server-only vars read inside handler functions (or via `config.server.ts` wrappers) — never at module scope
- Fallback pattern: `import.meta.env.VITE_FOO || process.env.VITE_FOO` for SSR compatibility
- `.server.ts` suffix prevents Vite from bundling server-only modules into client chunks

**Consequences:**

- Clear visual distinction between public and secret env vars
- No accidental secret exposure — non-VITE\_ vars are unavailable in client code
- `config.server.ts` provides `getServerConfig()`, `hasTwilio()`, `hasEmail()` convenience helpers
- `.env.template` serves as the single source of truth for all required vars
- Cloudflare Workers require per-request resolution — the function-wrapper pattern satisfies this

### ADR-005: Staff Lockout Modal + Twilio Rating Loop

**Context:** The business owner explicitly rejected digital payments and Stripe. All payments processed in-store (Credit/Debit, Cash, Venmo, Cash App). The system needed a mechanism to ensure staff accountability for capturing payment and service notes after each completed appointment.

**Decision:**

- **Staff Lockout Modal (System-Enforced):** When a booking status changes to `completed`, the system does NOT immediately finalize it. Instead, `completed_at` remains `NULL`. The assigned staff member is "locked" — they cannot proceed in the staff dashboard until they submit the forced modal. The modal captures: payment method (radio: Credit/Debit | Cash | Venmo | Cash App), tip amount (number input), service notes (textarea, optional). Upon submission, `completeStaffModal(bookingId, data)` writes the fields and sets `completed_at = NOW()`. There is no admin toggle to disable this — it is system-automated.
- **Twilio 1-5 Rating Loop:** After the staff modal is submitted, the system sends an SMS to the client: "Thanks for visiting! Reply with a number 1-5 to rate your experience." The Twilio webhook (`/api/twilio-webhook`) receives the reply and branches:
  - Rating 4-5: Reply with Google Review link, update `bookings.client_rating`.
  - Rating 1-3: Reply with apology message, update `bookings.client_rating`, insert an `owner_alerts` record for the owner dashboard.

**Consequences:**

- No Stripe dependency, no PCI scope
- Tips tracked per booking in `tip_amount` column
- Owner alerted on low ratings via `owner_alerts` table
- Staff accountability is hard-enforced — no way to bypass the modal
- Client feedback loop is automated and immediate
- Google Review link drives reputation growth

### ADR-006: Admin CRUD via Server Functions

**Context:** The admin panel needs to manage staff, services, business hours, and settings. These are standard CRUD operations but require authentication and salon-scoped access.

**Decision:** All CRUD operations live in dedicated server function files (`admin-crud.functions.ts`, `admin.functions.ts`). Every operation uses `requireSupabaseAuth` middleware. Soft-delete for staff/services via `is_active` boolean toggle instead of DELETE. `updateSalonHours` updates the `business_hours` JSONB column directly.

**Consequences:**

- Uniform auth pattern across all admin operations
- Soft-delete preserves referential integrity for historical bookings
- Business hours stored as JSONB — schema-flexible, no migration needed for hour format changes
- Admin UI uses tabbed layout (`admin.tsx`) with imported sub-component views (`-admin-settings.tsx`, `-admin-dashboard.tsx`, etc.)
- `linkSelfToFirstSalon` demo helper auto-links first auth user as owner for onboarding

### ADR-007: Rate Limiting — Sliding Window

**Context:** Public booking endpoints are vulnerable to abuse — bots could flood bookings or probe availability. A simple, low-dependency solution was needed that doesn't require Redis or external infrastructure.

**Decision:** Implemented a generic `RateLimiter` class in `rate-limiter.ts` using a sliding window algorithm with configurable `windowMs` and `max`. Applied to `createPublicBooking`: 3 requests per 5 minutes per phone number. Module-level singleton instance. Periodic pruning via `setInterval().unref()` to prevent memory growth.

**Consequences:**

- In-memory only — restarts reset windows (acceptable for per-process Nitro deployments)
- Simple, self-contained, zero external dependencies
- Keys by phone number (not IP) — avoids false positives from shared IPs
- Pruning interval uses `.unref()` so it doesn't block process shutdown
- Can be replaced with DB-backed limiter if cross-instance enforcement needed at scale

### ADR-008: Notification Channels

**Context:** Clients expect booking confirmations and reminders. The system needed transactional notifications without mandating any specific provider.

**Decision:** Both SMS (Twilio) and Email (Resend) are integrated as optional, gated channels. Each is guarded by a `has*()` check (`hasTwilio()`, `hasEmail()`) and uses soft-fail on errors (log, don't throw). This means the booking succeeds even if notifications fail.

**Consequences:**

- System fully functional without any notification provider configured
- Adding a new channel requires: new `.server.ts` helper, new `has*()` gate, call site in `createPublicBooking`
- SMS is primary channel (phone is required on booking form)
- Email is secondary (email is optional on booking form)
- Soft-fail prevents notification errors from blocking bookings
- Templates are inline HTML strings — no template engine dependency

### ADR-009: Genericization Approach

**Context:** The codebase started as a salon-specific app (OP Nails). To sell as a template, all hardcoded brand references needed removal — zero tolerance for brand leakage.

**Decision:** All salon-specific values extracted to `src/lib/env.ts` helper functions. Brand values (name, address, phone, social links, OG image) come from `VITE_*` env vars with sensible fallbacks. Service categories are grouped dynamically: `[...new Set(services.map(s => s.category).filter(Boolean))].sort()`. Verified via grep that zero hardcoded brand references remain in `src/`.

**Consequences:**

- Zero code changes needed to brand a new salon — only env vars
- `getSalonName()`, `getSalonAddress()`, `getSalonPhone()`, `getSalonSocial()` are the single source of brand identity
- OG image, tagline, social links all env-controlled
- Test suite validates env fallback behavior
- `BUSINESS` constant removed — all consumers migrated to env helpers

### ADR-010: Test Strategy

**Context:** The project needed a testing approach that covers the most risk-prone areas without over-investing in brittle component tests.

**Decision:** Vitest for unit testing (76+ tests). Focus on:

- Zod schema `.safeParse()` pattern for input validation coverage
- Process.env mocking via save/restore pattern for config/env tests
- Layer-focused tests: validation logic, server function inputs, env fallbacks
- No component/E2E tests yet

**Consequences:**

- High confidence in data validation and env configuration
- Tests are fast (no browser, no DOM)
- Validation errors caught at PR time, not runtime
- Component tests deferred — would add value for booking flow, staff modal, and admin CRUD UI
- CI runs `vitest run` before build

### ADR-011: Deployment Model

**Context:** Salons have varying technical capabilities. The deployment model must be simple enough for a developer to set up per salon while supporting CI/CD automation.

**Decision:** Deploy via Vite build with Nitro (Vercel/Cloudflare target) to Vercel or Cloudflare Pages/Workers. GitHub Actions CI (lint → typecheck → test → build) on push/PR to main. Each salon = separate deployment with unique env vars. Supabase project can be shared (row-level isolation via `salon_id` column) or dedicated per salon.

**Consequences:**

- `bun build` produces `dist/` output deployable to Vercel or Cloudflare Pages
- Per-salon env vars: `VITE_SALON_ID`, `VITE_SALON_NAME`, etc. must be set per deployment
- Twilio webhook endpoint: `{APP_URL}/api/twilio-webhook`
- CI matrix can deploy multiple salons from one repo (separate branches or deploy hooks)
- Each deployment gets its own domain and env var set

---

## Key File Map

| File                                                    | Role                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/start.ts`                                          | TanStack Start instance + global middleware (auth attacher, error middleware)                                                                                                               |
| `src/server.ts`                                         | SSR entry point + error normalization (h3 error recovery)                                                                                                                                   |
| `src/router.tsx`                                        | Router + QueryClient setup                                                                                                                                                                  |
| `src/routeTree.gen.ts`                                  | Auto-generated route tree (do not edit)                                                                                                                                                     |
| `src/routes/__root.tsx`                                 | Root layout — error boundary, SEO head, style providers                                                                                                                                     |
| `src/routes/index.tsx`                                  | Home page — featured services, staff cards, hours, map                                                                                                                                      |
| `src/routes/book.tsx`                                   | Multi-step booking flow (service → staff → time → confirm)                                                                                                                                  |
| `src/routes/booking-confirmed.tsx`                      | Post-booking confirmation page                                                                                                                                                              |
| `src/routes/services.tsx`                               | Full service menu grouped by category                                                                                                                                                       |
| `src/routes/appointments.tsx`                           | Phone-based appointment lookup + management                                                                                                                                                 |
| `src/routes/auth.tsx`                                   | Sign-in page                                                                                                                                                                                |
| `src/routes/_authenticated/route.tsx`                   | Auth guard layout — redirects to /auth if unauthenticated                                                                                                                                   |
| `src/routes/_authenticated/admin.tsx`                   | Admin panel — tabbed UI (dashboard, calendar, commissions, alerts, waitlist, floor, calls, settings)                                                                                        |
| `src/routes/_authenticated/_staff/_staff.tsx`           | Staff layout route, auth-gated (staff role check)                                                                                                                                           |
| `src/routes/_authenticated/_staff/-staff-dashboard.tsx` | Staff dashboard — forced lockout modal for pending completions                                                                                                                              |
| `src/routes/api/twilio-webhook.ts`                      | Twilio incoming SMS handler (1-5 rating replies)                                                                                                                                            |
| `src/lib/env.ts`                                        | Public env var helpers — `getSalonName()`, `getSalonAddress()`, `getSalonPhone()`, `getSalonSocial()`, `getOGImage()`, `getUmamiWebsiteId()`, etc. Reads `VITE_*` vars with fallbacks       |
| `src/lib/config.server.ts`                              | Server-only config — `getServerConfig()`, `hasTwilio()`, `hasEmail()`. Reads non-`VITE_` vars at call time                                                                                  |
| `src/lib/booking.functions.ts`                          | Public booking server functions: `createPublicBooking`, `completeStaffModal`, `getPendingCompletions`, `lookupAppointments`, `cancelPublicBooking`. Twilio SMS notifications, rate limiting |
| `src/lib/twilio.server.ts`                              | Twilio rating loop: `sendRatingSms`, `handleRatingReply` (1-5 branching)                                                                                                                    |
| `src/lib/admin-crud.functions.ts`                       | Admin CRUD server functions: staff/services/hours management, all authenticated via `requireSupabaseAuth`                                                                                   |
| `src/lib/admin.functions.ts`                            | Admin helpers: `getMyStaff`, `linkSelfToFirstSalon`, `getOwnerAlerts`, `seedDemoData`                                                                                                       |
| `src/lib/rate-limiter.ts`                               | Generic sliding-window rate limiter class                                                                                                                                                   |
| `src/lib/email.server.ts`                               | `sendBookingConfirmation` via Resend                                                                                                                                                        |
| `src/lib/salon.ts`                                      | Client-side helpers: `fetchSalon`, `fetchServices`, `fetchStaff`, `computeAvailableSlots`, formatting utilities                                                                             |
| `src/lib/error-capture.ts`                              | Global error capture with 5-second TTL (recover lost stack traces from h3)                                                                                                                  |
| `src/lib/error-page.ts`                                 | Styled HTML error page renderer                                                                                                                                                             |
| `src/integrations/supabase/client.ts`                   | Public anon Supabase client (lazy proxy singletons)                                                                                                                                         |
| `src/integrations/supabase/client.server.ts`            | Service role admin Supabase client — import inside handlers only                                                                                                                            |
| `src/integrations/supabase/auth-attacher.ts`            | Global middleware — attaches Supabase bearer token to serverFn RPCs                                                                                                                         |
| `src/integrations/supabase/auth-middleware.ts`          | `requireSupabaseAuth` — validates bearer token, provides auth-context client                                                                                                                |
| `src/components/site-chrome.tsx`                        | Site-wide layout: header, footer, social links. All brand values from env helpers                                                                                                           |
| `src/routes/_authenticated/-admin-alerts.tsx`           | Low-rating alerts list + CRM data table                                                                                                                                                     |
| `supabase/migrations/`                                  | 7+ migrations: schema (enums, tables, RLS, RPCs), seed data, security refinements, constraint additions, pivot migration                                                                    |
| `docs/GENERICIZATION_ROADMAP.md`                        | Roadmap for extracting brand-specific content                                                                                                                                               |
| `docs/TECHNICAL_SPEC.md`                                | Technical specification                                                                                                                                                                     |
| `docs/onboarding-new-salon.md`                          | Step-by-step guide for onboarding a new salon deployment                                                                                                                                    |

---

## Data Model

### Core Tables

| Table                | Key Columns                                                                                                                                                                                                         | Access                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `salons`             | id, name, address, phone, business_hours (JSONB), commission_split, tip_split_default                                                                                                                               | Anon: read. Auth: update (owner)        |
| `staff`              | id, salon_id, auth_user_id, name, role (enum: owner/staff), working_hours (JSONB), is_active                                                                                                                        | Anon: read active. Auth: CRUD (members) |
| `services`           | id, salon_id, name, category, duration_minutes, price, is_active                                                                                                                                                    | Anon: read active. Auth: CRUD (members) |
| `clients`            | id, salon_id, phone (unique per salon), name, email                                                                                                                                                                 | Service role only for writes            |
| `bookings`           | id, salon_id, client_id, staff_id, service_id, start_time, end_time, status (enum), payment_method (enum: Credit/Debit/Cash/Venmo/Cash App), tip_amount, service_notes, completed_at, client_rating, rating_sent_at | Anon: read via RPC only                 |
| `commission_records` | id, booking_id, staff_id, service_amount, tip_amount, commission_amount, status                                                                                                                                     | Auth (staff/owner)                      |
| `owner_alerts`       | id, salon_id, booking_id, client_phone, rating, acknowledged, created_at                                                                                                                                            | Auth (owner)                            |
| `waitlist_entries`   | id, salon_id, client_id, service_id, desired_date, status (enum)                                                                                                                                                    | Auth (staff)                            |
| `floor_status`       | id, staff_id, state (enum: with_client/available/offline), current_client_id, started_at                                                                                                                            | Auth (staff)                            |
| `ai_calls`           | id, salon_id, caller_phone, transcript, summary, action_taken                                                                                                                                                       | Service role                            |
| `profiles`           | id (FK auth.users), email, full_name                                                                                                                                                                                | Authenticated user only                 |

### Key Enums

- `app_role`: `owner | staff`
- `booking_status`: `confirmed | completed | cancelled | no_show`
- `payment_method`: `Credit/Debit | Cash | Venmo | Cash App`
- `floor_state`: `with_client | available | offline`
- `waitlist_status`: `active | fulfilled | cancelled`

### RLS Strategy

- Anonymous users can read active services, active staff, and salon info — the public-facing catalog
- All writes require authenticated salon membership, enforced via `is_salon_member()` SECURITY DEFINER function
- Service role (supabaseAdmin) bypasses RLS entirely — used sparingly in public booking server functions
- `get_busy_slots()` RPC is the public read path for bookings (exposes only time ranges, not client data)
- RLS is defense-in-depth — primary isolation is the `salon_id` filter in every query (ADR-002)

---

## Key Dependencies (package.json)

| Package                                   | Purpose                                  |
| ----------------------------------------- | ---------------------------------------- |
| `@tanstack/react-start`                   | SSR framework, server functions, routing |
| `@tanstack/react-router`                  | File-based routing, type-safe links      |
| `@tanstack/react-query`                   | Data fetching, caching, mutations        |
| `react` / `react-dom` 19                  | UI                                       |
| `@supabase/supabase-js`                   | Database client + Auth                   |
| `twilio`                                  | SMS notifications + 1-5 rating loop      |
| `resend`                                  | Email notifications                      |
| `zod`                                     | Input validation                         |
| `tailwindcss` v4                          | Styling                                  |
| `@radix-ui/*`                             | Headless UI primitives                   |
| `lucide-react`                            | Icons                                    |
| `@hookform/resolvers` / `react-hook-form` | Form management                          |
| `date-fns`                                | Date utilities                           |
| `nitro`                                   | Server engine (via TanStack Start)       |
| `vite` 7                                  | Build tool                               |
| `vitest`                                  | Testing framework                        |

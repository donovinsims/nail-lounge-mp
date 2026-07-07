# AI Blueprint: Generic Salon Platform

> **What every AI agent needs to know before working on this project.**
> A reusable blueprint for understanding, customizing, and extending the fully generic TanStack Start + Supabase salon booking and management platform.

---

## 1. Quick Start

```
Location:      /Users/forex/nail-lounge
Framework:     TanStack Start (React 19) + Vite 7 + Tailwind CSS v4
Database:      Supabase PostgreSQL (10+ tables, 5 enums, RLS, RPCs)
Auth:          Supabase Auth (magic links + service role)
Payments:      In-store only (Credit/Debit, Cash, Venmo, Cash App — tracked via staff modal)
Notifications: Twilio SMS (booking confirmations + 1-5 rating loop), Resend email
Analytics:     Umami (privacy-friendly, optional)
Testing:       Vitest (76+ unit tests — Zod schemas, env/config, rate limiter)
CI/CD:         GitHub Actions (lint → typecheck → build)
Deployment:    Vercel (Nitro SSR) or Cloudflare Pages/Workers
Runtime:       Bun (build + dev)
```

### What this app does

A fully branded, deploy-it-yourself salon website with:

- Public site: home page, services menu, gallery, gift cards, appointment booking
- Admin console: dashboard, calendar, staff/services/hours CRUD, waitlist, commission ledger, AI call log, alerts
- Staff lockout modal: forced system-enforced modal capturing payment method, tip, and service notes
- Twilio 1-5 rating loop: automated SMS feedback with branching (4-5 → Google Review link, 1-3 → owner alert)
- SMS + email booking confirmations

### What makes it "generic"

- **Zero hardcoded branding** — all salon identity comes from `VITE_*` env vars
- **Single-tenant isolation** — one deployment = one salon, identified by `VITE_SALON_ID`
- **All env vars documented** in `.env.template` with clear required/optional markers
- **Feature gating** — Twilio, Resend, Umami all optional via `has*()` helpers
- **Dynamic service categories** — `[...new Set(services.map(s => s.category).filter(Boolean))].sort()`
- **Admin CRUD via UI** — add staff, services, hours through Settings (no DB editing)

### Key commands

```bash
bun dev              # vite dev server
bun build            # production build (Cloudflare target)
bun run test         # vitest run (76+ tests)
bun run lint         # eslint
bun run format       # prettier --write .
```

---

## 2. Architecture DNA — What Makes It Reusable

### 2.1 Single-Tenant Isolation (The Core Invariant)

**Rule:** Every database query MUST filter by `salon_id` derived from `VITE_SALON_ID`.

```typescript
// src/lib/env.ts
export function getSalonId(): string | undefined {
  return import.meta.env.VITE_SALON_ID;
}
```

There is no multi-tenant branching logic. Each deployment gets its own `VITE_SALON_ID`. All server functions, admin CRUD, public booking — every query includes `.eq("salon_id", salonId)`. This is checked at the application layer; RLS is defense-in-depth.

### 2.2 Branding from Env, Not Code

All salon-specific display values come from `src/lib/env.ts` helpers:

| Helper                | Env Var                                       | Fallback               |
| --------------------- | --------------------------------------------- | ---------------------- |
| `getSalonName()`      | `VITE_SALON_NAME`                             | "Your Salon Name"      |
| `getSalonAddress()`   | `VITE_SALON_ADDRESS`                          | `""`                   |
| `getSalonPhone()`     | `VITE_SALON_PHONE`                            | `""`                   |
| `getSalonTagline()`   | `VITE_SALON_TAGLINE`                          | "Precision nail care"  |
| `getOGImage()`        | `VITE_OG_IMAGE`                               | `""`                   |
| `getSalonSocial()`    | `VITE_SALON_EMAIL, VITE_SALON_INSTAGRAM, ...` | `""` each              |
| `getSalonNameShort()` | (derived from `getSalonName()`)               | Initials for admin nav |

**Zero code changes needed to brand a new salon.** Set env vars, deploy. That's it.

### 2.3 Public vs Server-Only Env Convention

| Prefix    | Scope                                | Example                                            | Risk                                  |
| --------- | ------------------------------------ | -------------------------------------------------- | ------------------------------------- |
| `VITE_*`  | Client + server (shipped to browser) | `VITE_SALON_NAME`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Safe for public values                |
| No prefix | Server-only (never in client bundle) | `TWILIO_AUTH_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`   | Secrets — must use `.server.ts` files |

Server-only secrets are read inside handler functions (not at module scope) because Cloudflare Workers resolve env per-request:

```typescript
// src/lib/config.server.ts — read INSIDE the function, never at module scope
export function getServerConfig() {
  return {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
    // ...
  };
}
```

The `.server.ts` file suffix prevents Vite from bundling this module into client chunks.

### 2.4 Feature Gating (All Integrations Optional)

Every third-party integration is optional, gated by a `has*()` helper:

```typescript
// src/lib/config.server.ts
hasTwilio(); // true when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER are set
hasEmail(); // true when RESEND_API_KEY is set
```

**Pattern:** Check `has*()` before attempting the integration. Soft-fail on errors (log, don't throw). The booking succeeds even if notifications fail.

```typescript
// booking.functions.ts — soft-fail pattern
if (hasTwilio()) {
  try { await sendSms(...); }
  catch (e) { console.error("SMS failed", e); }
}
```

### 2.5 Server Functions (No REST API)

All data mutations use TanStack Start's `createServerFn`. No separate API router.

- **Public writes:** `createPublicBooking` uses `supabaseAdmin` (service role, dynamically imported)
- **Staff writes:** `completeStaffModal` writes payment method, tip, notes; triggers Twilio rating SMS
- **Authenticated writes:** Admin CRUD uses `requireSupabaseAuth` middleware (auth-context client respects RLS)
- **Input validation:** Zod `.parse()` inside each handler
- **Rate limiting:** `createPublicBooking` — 3 requests per 5 minutes per phone number (in-memory sliding window)
- **Webhooks:** Twilio webhooks use standard request handlers under `/src/routes/api/`

### 2.6 Data Model — 10+ Tables

| Table                | Purpose                                                  | Public Access            |
| -------------------- | -------------------------------------------------------- | ------------------------ |
| `salons`             | Business identity, hours, commission config              | Anon read                |
| `staff`              | Employees, roles, working hours                          | Anon read (active only)  |
| `services`           | Menu items, prices, durations                            | Anon read (active only)  |
| `clients`            | Customer records (phone-unique per salon)                | Service role writes only |
| `bookings`           | Appointments, status, payment_method, tip_amount, rating | Anon read via RPC only   |
| `commission_records` | Per-staff commission tracking                            | Auth (staff/owner)       |
| `owner_alerts`       | Low-ratings alerts (1-3) with booking context            | Auth (owner)             |
| `waitlist_entries`   | Demand capture for fully booked slots                    | Auth only                |
| `floor_status`       | Real-time staff state (with_client/available/offline)    | Auth + Realtime          |
| `ai_calls`           | AI receptionist call logs                                | Service role only        |
| `profiles`           | Auth user profiles (FK to auth.users)                    | Authenticated user only  |

Key enums: `app_role` (owner|staff), `booking_status` (confirmed|completed|cancelled|no_show), `payment_method` (Credit/Debit|Cash|Venmo|Cash App), `floor_state` (with_client|available|offline), `waitlist_status` (active|fulfilled|cancelled).

### 2.7 Route Map

| Route                | File                                         | Auth                  |
| -------------------- | -------------------------------------------- | --------------------- |
| `/`                  | `index.tsx`                                  | Public                |
| `/services`          | `services.tsx`                               | Public                |
| `/service`           | `service.tsx`                                | Public                |
| `/book`              | `book.tsx` (multi-step wizard)               | Public                |
| `/booking-confirmed` | `booking-confirmed.tsx`                      | Public                |
| `/appointments`      | `appointments.tsx`                           | Public (phone lookup) |
| `/gift-cards`        | `gift-cards.tsx`                             | Public                |
| `/gallery`           | `gallery.tsx`                                | Public                |
| `/auth`              | `auth.tsx`                                   | Public                |
| `/auth/callback`     | `auth/callback.tsx`                          | OAuth callback        |
| `/admin`             | `_authenticated/admin.tsx` (8 tabs)          | Auth required         |
| `/staff`             | `_authenticated/_staff/-staff-dashboard.tsx` | Auth (staff only)     |

Admin tabs (imported sub-components): Dashboard (with payment-method breakdown + alerts), Calendar (with master overlay), Commissions, Alerts + CRM, Waitlist, Floor, AI Calls, Settings.

Staff route: System-enforced lockout modal overlays the dashboard when pending completions exist.

---

## 3. Customization Checklist — New Salon Setup

This is the minimal path to turn the template into a live, branded salon site.

### Prerequisites

- [ ] Supabase project (free tier works)
- [ ] Twilio account (optional — needed for SMS + rating loop)
- [ ] Resend API key (optional — needed for email)
- [ ] Domain name (e.g., `nails-by-ana.com`)
- [ ] `git`, `node ≥22`, `bun` installed

### Step-by-Step

1. **Copy the template**

   ```bash
   cp -r ~/nail-lounge ~/salons/ana-nails
   cd ~/salons/ana-nails && rm -rf .git && git init && git add -A && git commit -m "init"
   ```

2. **Set environment variables** — copy `.env.template` to `.env`, fill in:
   - `VITE_SALON_ID` — generate a UUID (will match the DB row)
   - `VITE_SALON_NAME`, `VITE_SALON_ADDRESS`, `VITE_SALON_PHONE`, `VITE_SALON_TAGLINE`
   - `VITE_SALON_EMAIL`, `VITE_SALON_INSTAGRAM`, etc. (social links)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_APP_URL` (your domain)

3. **Insert salon row in Supabase**

   ```sql
   INSERT INTO salons (id, name, phone, address, business_hours)
   VALUES ('<VITE_SALON_ID>', 'Ana Nails', '+15551234567', '123 Main St', '{"monday":{"open":"09:00","close":"18:00"},...}');
   ```

4. **Run migrations** in order from `supabase/migrations/`:
   - Initial schema (enums, tables, RLS, triggers)
   - Staff column additions
   - Security cleanup
   - RPC-based bookings read
   - Booking overlap constraint
   - Pivot migration (drop Stripe cols, add payment_method + rating columns)

5. **Configure Twilio** (optional):
   - Create a Twilio account and buy a phone number
   - Set the SMS webhook URL to `<YOUR_APP_URL>/api/twilio-webhook`
   - Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

6. **Deploy** to Cloudflare Pages (or Vercel with `NITRO_PRESET=vercel`):
   - Build command: `bun run build`
   - Output: `dist/`
   - Add all env vars (mark secrets as encrypted)

7. **Login as owner** → Settings → Add staff, services, set hours → The app is now fully branded and operational.

8. **Test staff modal flow** — Book an appointment online, mark as completed in admin, log in as staff to verify forced modal appears with payment method, tip, and notes fields.

**Full runbook:** `docs/DEPLOYMENT_RUNBOOK.md`
**Detailed onboarding:** `docs/onboarding-new-salon.md`

---

## 4. Extension Cookbook — How to Add Features

### Pattern 1: New Public Endpoint

Add a `createServerFn` in `booking.functions.ts` or a new `.functions.ts` file:

```typescript
// src/lib/reviews.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        bookingId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // ... insert into reviews table
  });
```

Call it from any route component via `useServerFn`.

### Pattern 2: New Admin Feature

1. Add server function in `admin.functions.ts` or `admin-crud.functions.ts`
2. Create tab component in `src/routes/_authenticated/-admin-*.tsx`
3. Import it in `src/routes/_authenticated/admin.tsx`
4. Add tab to the `Tab` type union and the `NAV` array

```typescript
// In admin.tsx
import Reports from "./-admin-reports";

type Tab =
  | "dashboard"
  | "calendar"
  | "commissions"
  | "alerts"
  | "waitlist"
  | "floor"
  | "calls"
  | "settings"
  | "reports";
const NAV = [...prev, { id: "reports", label: "Reports", icon: BarChart3 }];
```

### Pattern 3: New Third-Party Integration

1. Add env var helpers in `src/lib/env.ts` (for `VITE_*` public vars)
2. Add server config + `has*()` check in `src/lib/config.server.ts`
3. Create integration module in `src/lib/<service>.server.ts`
4. Gate call sites with the `has*()` check + soft-fail

```typescript
// src/lib/config.server.ts
export function hasDiscord(): boolean {
  return !!process.env.DISCORD_WEBHOOK_URL;
}

// booking.functions.ts — call site
if (hasDiscord()) {
  try {
    await sendDiscordNotification(booking);
  } catch (e) {
    console.error(e);
  }
}
```

### Pattern 4: New DB Table

1. Create a migration in `supabase/migrations/` (timestamped, sequential)
2. Add RLS policies for anon/auth/service-role access
3. Update schema reference in `docs/ARCHITECTURE.md`
4. Create server functions with Zod validation
5. Add admin UI tab or public route as needed

### Pattern 5: New Public Route

Add a file in `src/routes/` — TanStack Router auto-discovers it. Use the file-based routing naming convention:

```
src/routes/promotions.tsx     → /promotions
src/routes/promotions/$id.tsx → /promotions/:id
```

### Key Integration Points

| Integration              | What's Needed                                                      | Gated By           |
| ------------------------ | ------------------------------------------------------------------ | ------------------ |
| Twilio SMS + Rating Loop | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` | `hasTwilio()`      |
| Resend Email             | `RESEND_API_KEY`                                                   | `hasEmail()`       |
| Umami Analytics          | `VITE_UMAMI_WEBSITE_ID`                                            | Empty string check |

---

## 5. What's Intentionally Excluded (By Design)

These are NOT part of the template. Adding them would require application-level work:

- **Digital payment processing** — All payments handled in-store. No Stripe integration.
- **Multi-tenant SaaS mode** — Each salon gets its own deployment. No tenant table, no org switcher.
- **Native mobile app** — The mobile-responsive web app covers the client experience (booking, appointment lookup). No React Native or Swift/Kotlin code.
- **On-premise installation** — Cloud-only. Supabase + Vercel/Cloudflare.
- **Real AI receptionist** — Stubs exist (AI Calls tab, `ai_calls` table). Real integration with a telephony AI provider (Bland.ai, Retell, etc.) is left to the implementer.
- **Inventory management** — No product inventory, supply tracking, or vendor management tables.
- **Payroll integration** — Commission tracking records the data. Sending it to Gusto, ADP, etc. is out of scope.
- **Marketing tools** — No email campaigns, SMS marketing, loyalty programs, or referral tracking.
- **Multi-language / i18n** — English only. No i18n framework.
- **PWA / offline mode** — The app relies on server-side rendering and Supabase connectivity.

---

## 6. Lessons Learned (What We'd Do Differently)

### Done Well

- **Genericization first.** Extracting all brand values to env helpers before adding features prevented hardcoded regression. This discipline paid off every time a new component was added.
- **Env var convention.** The `VITE_` / non-`VITE_` split with `.server.ts` file suffix eliminated an entire class of secret-exposure bugs. New contributors understand the rule instantly.
- **Server functions over REST.** Colocating backend logic with frontend imports eliminated boilerplate and kept the codebase navigable. The `requireSupabaseAuth` middleware pattern kept auth consistent.
- **Sliding-window rate limiter.** Simple, dependency-free, and effective. The `setInterval().unref()` pattern prevents memory leaks.
- **Feature gating with soft-fail.** Making every third-party integration optional and non-blocking means the app works perfectly for a cash-only salon with no SMS or email provider.
- **Staff lockout modal.** System-enforced forced modal ensures accountability — staff cannot proceed without capturing payment method, tip, and service notes.
- **Twilio rating loop.** Automated 1-5 rating collection with intelligent branching (positive → Google Review link, negative → owner alert) creates a closed feedback loop.

### Would Improve

- **Component tests.** 76+ unit tests cover validation and config, but no component/E2E tests exist for the booking flow, staff modal, or admin CRUD UI. A Playwright suite for the booking wizard would catch regressions that unit tests can't.
- **Admin UI testability.** Admin components import `useServerFn` directly rather than through a dependency injection pattern, making them hard to unit-test in isolation.
- **Migration ordering.** Migration filenames use timestamps but aren't perfectly sequential for new setups. A `supabase/migrations/README.md` with the correct order and `supabase migration up` instructions would help.
- **Busy-slots RPC.** The `get_busy_slots()` RPC is the public read path for bookings, but it returns all non-cancelled bookings for a salon. A staff-id filter would be more efficient for the booking step where the user selects a staff member.
- **CSS variable documentation.** Brand colors (`BRAND_PRIMARY_COLOR`, `BRAND_SECONDARY_COLOR`) are referenced in `AGENTS.md` but not fully plumbed through Tailwind theme tokens. A customization doc for theme colors would be useful.
- **Error message internationalization.** All error messages are hardcoded English strings. A pattern for user-facing messages would be needed for non-English salons.
- **Seed data strategy.** The current seed data inserts directly in migrations. A separate seed script that can be run per-salon post-deployment would be more flexible.

### File Organization Tips

- Keep `.functions.ts` files focused on related operations (booking, admin-crud, admin)
- Name admin tab components with the `-admin-` prefix convention (`-admin-dashboard.tsx`, `-admin-waitlist.tsx`)
- Name staff route components with the `-staff-` prefix convention (`-staff-dashboard.tsx`)
- Place shared types in a dedicated `src/types/` directory (the project currently defines types inline)
- API webhook handlers live in `src/routes/api/` as standard request handlers (Twilio)

---

## Appendix: Key Files Reference

| File                                                    | What It Does                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/env.ts`                                        | Public env helpers — `getSalonName()`, `getSalonAddress()`, `getSalonPhone()`, `getSalonSocial()`, `getSalonId()`, `getOGImage()`, `isSeedAllowed()` |
| `src/lib/config.server.ts`                              | Server-only config — `getServerConfig()`, `hasTwilio()`, `hasEmail()`                                                                                |
| `src/lib/booking.functions.ts`                          | Public booking: `createPublicBooking`, `completeStaffModal`, `getPendingCompletions`, `lookupAppointments`, `cancelPublicBooking`                    |
| `src/lib/twilio.server.ts`                              | Twilio rating loop: `sendRatingSms`, `handleRatingReply`                                                                                             |
| `src/lib/admin-crud.functions.ts`                       | Staff/services/hours CRUD — all authenticated via `requireSupabaseAuth`                                                                              |
| `src/lib/admin.functions.ts`                            | `getMyStaff`, `linkSelfToFirstSalon`, `getOwnerAlerts`, `seedDemoData`                                                                               |
| `src/lib/salon.ts`                                      | `computeAvailableSlots`, `fetchSalon`, `fetchServices`, `fetchStaff`                                                                                 |
| `src/lib/rate-limiter.ts`                               | Generic sliding-window rate limiter class                                                                                                            |
| `src/lib/email.server.ts`                               | `sendBookingConfirmation` via Resend                                                                                                                 |
| `src/lib/error-capture.ts`                              | Global error capture with 5-second TTL                                                                                                               |
| `src/integrations/supabase/client.ts`                   | Public anon Supabase client                                                                                                                          |
| `src/integrations/supabase/client.server.ts`            | Service role admin client (dynamic import)                                                                                                           |
| `src/integrations/supabase/auth-middleware.ts`          | `requireSupabaseAuth` middleware                                                                                                                     |
| `src/integrations/supabase/auth-attacher.ts`            | Global middleware — attaches bearer token to serverFn RPCs                                                                                           |
| `src/routes/_authenticated/admin.tsx`                   | Admin panel — tabbed UI with 8 sub-views                                                                                                             |
| `src/routes/_authenticated/_staff/-staff-dashboard.tsx` | Staff dashboard — forced lockout modal for pending completions                                                                                       |
| `src/routes/api/twilio-webhook.ts`                      | Incoming Twilio SMS handler (1-5 rating replies)                                                                                                     |
| `.env.template`                                         | Single source of truth for all env vars                                                                                                              |
| `supabase/migrations/`                                  | 7+ migrations in order                                                                                                                               |

---

## Appendix: Documentation Map

| Doc                         | Audience          | What It Covers                                                                     |
| --------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `ARCHITECTURE.md`           | Developers        | Full ADRs, data model, RLS strategy, file map, dependencies                        |
| `TECHNICAL_SPEC.md`         | Evaluators/Buyers | Stack details, security assessment, production readiness scorecard, technical debt |
| `TEST-PATTERNS.md`          | Developers        | Test conventions, coverage goals, pattern reference                                |
| `DEPLOYMENT_RUNBOOK.md`     | DevOps            | Env vars, Supabase setup, Twilio config, Cloudflare deploy, rollback plan          |
| `onboarding-new-salon.md`   | Salon setup       | Step-by-step from zero to live (non-technical owner + developer)                   |
| `GENERICIZATION_ROADMAP.md` | Maintainers       | What was extracted, what's left, verification checklist                            |
| `AI-BLUEPRINT.md`           | AI agents + devs  | **This document** — everything an agent needs before coding                        |

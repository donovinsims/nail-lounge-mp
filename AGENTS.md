# nail-lounge — TanStack Start + Supabase Salon Template

## Project Identity

- **Name:** nail-lounge
- **Framework:** TanStack Start (`@tanstack/react-start`) + Vite 7 + React 19
- **Stack:** Tailwind CSS v4, shadcn/ui (new-york, no RSC), Supabase Auth + PostgreSQL, Twilio
- **Multi-tenant capable:** One deployment per salon (SALON_ID in env). Full isolation — every DB query filters by SALON_ID.
- **No hardcoded branding:** All salon-specific values come from env helpers in `src/lib/env.ts`. The `BUSINESS` constant no longer exists.

## Commands

```
bun dev              # vite dev
bun build            # vite build (also regenerates route tree)
bun run build:dev    # vite build --mode development
bun run lint         # eslint .
bun run test         # vitest run
bun run test:watch   # vitest --watch
bun run typecheck    # tsc --noEmit
bun run format       # prettier --write .
```

## Routes (`src/routes/`)

| Route                | File                    | Description                                                |
| -------------------- | ----------------------- | ---------------------------------------------------------- |
| `/`                  | `index.tsx`             | Home — featured services, staff cards, hours, map          |
| `/services`          | `services.tsx`          | Full menu (grouped by category dynamically)                |
| `/book`              | `book.tsx`              | Multi-step booking flow (service → staff → time → confirm) |
| `/booking-confirmed` | `booking-confirmed.tsx` | Post-booking confirmation landing page                     |
| `/appointments`      | `appointments.tsx`      | Phone-based appointment lookup                             |
| `/auth`              | `auth.tsx`              | Sign-in                                                    |
| `/_authenticated/`   | `admin.tsx` + sub-views | Admin area (gated by supabase auth)                        |

### Admin Sub-Views (imported by admin.tsx, not separate routes)

- `/_authenticated/-admin-dashboard.tsx` — overview with stats
- `/_authenticated/-admin-settings.tsx` — staff/services/hours CRUD
- `/_authenticated/-admin-waitlist.tsx` — waitlist management
- `/_authenticated/-admin-commissions.tsx` — payroll ledger (tips + services per staff)
- `/_authenticated/-admin-floor.tsx` — floor status management
- `/_authenticated/-admin-alerts.tsx` — low-rating owner alerts
- `/_authenticated/-admin-calls.tsx` — AI call log
- `/_authenticated/-admin-calendar.tsx` — multi-staff calendar grid view

### Staff Sub-Views (mounted at `/staff` by staff.tsx layout)

- `/staff` — forced lockout modal if pending completions exist; empty state otherwise
- `/staff/appointments` — staff's upcoming appointments

Generated file (do not edit by hand): `src/routeTree.gen.ts`

## Key Files

| File                               | Role                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/env.ts`                   | Env helpers: `getSalonName()`, `getSalonAddress()`, `getSalonPhone()`, `getSalonSocial()`, `getOGImage()`, `getUmamiWebsiteId()`, `getUmamiHost()`, `getSalonId()`, `isSeedAllowed()`. Reads `VITE_*` env vars with fallbacks.                                                                                                                                                                           |
| `src/lib/config.server.ts`         | Server-only config: `getServerConfig()`, `hasTwilio()`, `hasEmail()`. Reads non-`VITE_` env vars at call time (for CF Workers compat).                                                                                                                                                                                                                                                                   |
| `src/lib/twilio.server.ts`         | `sendRatingSms` (1-5 rating SMS after completed appointment), `handleRatingReply` (processes inbound SMS rating, sends Google Review link for 4-5, apology + owner alert for 1-3).                                                                                                                                                                                                                       |
| `src/lib/twilio-webhook.server.ts` | `handleTwilioWebhook` — parses Twilio form-encoded webhook, looks up booking by phone, delegates to `handleRatingReply`.                                                                                                                                                                                                                                                                                 |
| `src/lib/booking.functions.ts`     | `createPublicBooking`, `lookupAppointments`, `getPendingCompletions`, `completeStaffModal`, `getStaffAppointments`, `cancelPublicBooking`. Validates input (Zod), checks slot availability via RPC, upserts client, creates booking with `confirmed` status, sends Twilio SMS + Resend email. Staff modal flow captures tip/payment/notes, then triggers rating SMS. Rate-limited: 3 per 5min per phone. |
| `src/lib/admin-crud.functions.ts`  | CRUD server fns for staff (`getAllStaffForSalon`, `createStaff`, `updateStaff`, `deleteStaff`), services (`getAllServicesForSalon`, `createService`, `updateService`, `deleteService`), and `updateSalonHours`. All gated by `requireSupabaseAuth`.                                                                                                                                                      |
| `src/lib/admin.functions.ts`       | `getMyStaff`, `linkSelfToFirstSalon`, `seedDemoData`.                                                                                                                                                                                                                                                                                                                                                    |
| `src/lib/rate-limiter.ts`          | Generic sliding-window rate limiter class.                                                                                                                                                                                                                                                                                                                                                               |
| `src/lib/email.server.ts`          | `sendBookingConfirmation` via Resend.                                                                                                                                                                                                                                                                                                                                                                    |
| `src/lib/salon.ts`                 | `computeAvailableSlots` — 15-min slots, 30-min lead time, subtracts busy slots via RPC.                                                                                                                                                                                                                                                                                                                  |
| `src/lib/error-capture.ts`         | Global error capture with 5s TTL.                                                                                                                                                                                                                                                                                                                                                                        |
| `src/start.ts`                     | TanStack Start instance + global middleware                                                                                                                                                                                                                                                                                                                                                              |
| `src/server.ts`                    | SSR entry + error normalization                                                                                                                                                                                                                                                                                                                                                                          |
| `src/router.tsx`                   | Router + QueryClient setup                                                                                                                                                                                                                                                                                                                                                                               |

## Supabase Integration

### Client Layers

- `src/integrations/supabase/client` — public anon client (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `src/integrations/supabase/client.server` — service role admin client (`SUPABASE_SERVICE_ROLE_KEY`). Import inside handlers only (`const { supabaseAdmin } = await import(...)`), never at top level.
- `src/integrations/supabase/auth-attacher.ts` — global middleware, attaches Supabase bearer token to `createServerFn` RPC calls.
- `src/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` middleware for server functions.

### Env Variables

| Variable                        | Scope       | Required                                         |
| ------------------------------- | ----------- | ------------------------------------------------ |
| `VITE_SUPABASE_URL`             | Public      | Yes                                              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public      | Yes                                              |
| `SUPABASE_URL`                  | Server-only | Yes                                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only | For admin ops                                    |
| `VITE_SALON_ID`                 | Public      | Yes                                              |
| `VITE_SALON_NAME`               | Public      | Yes                                              |
| `TWILIO_ACCOUNT_SID`            | Server-only | For SMS                                          |
| `TWILIO_AUTH_TOKEN`             | Server-only | For SMS                                          |
| `TWILIO_PHONE_NUMBER`           | Server-only | For SMS                                          |
| `GOOGLE_REVIEW_URL`             | Server-only | Google review link for high-rating SMS follow-up |
| `RESEND_API_KEY`                | Server-only | For email                                        |
| `VITE_UMAMI_WEBSITE_ID`         | Public      | Optional (analytics)                             |
| `VITE_UMAMI_HOST`               | Public      | Optional (analytics)                             |
| `APP_URL`                       | Server-only | Yes (CORS/webhooks)                              |

Server-only values (without `VITE_` prefix) must be read inside a function/handler, not at module scope.

### Supabase Schema (8 migrations)

**Tables:** `salons`, `staff`, `services`, `clients`, `bookings`, `commission_records`, `waitlist_entries`, `floor_status`, `ai_calls`, `profiles`, `owner_alerts`

**Enums:** `app_role` (owner|staff), `booking_status` (confirmed|completed|cancelled|no_show), `payment_method` (Credit/Debit|Cash|Venmo|Cash App), `floor_state` (with_client|available|offline), `waitlist_status` (active|fulfilled|cancelled)

**Migrations:**

1. Initial schema + RLS + triggers + seed data
2. Staff column additions + full seed
3. Security cleanup — revoke EXECUTE on trigger functions
4. RPC-based bookings read + column-level grants refinement
5. Booking overlap exclusion constraint (exclude booking id from conflict check)
6. Add `stripe_session_id` column to bookings
7. Unique partial index on `staff.auth_user_id`
8. Pivot: drop Stripe/deposit columns, add `payment_method` enum, staff modal fields (`tip_amount`, `payment_method`, `service_notes`, `completed_at`), Twilio rating fields (`client_rating`, `rating_sent_at`), `owner_alerts` table

### RLS Key Points

- `get_busy_slots()` RPC is the public read path for bookings
- Anon can read limited fields of salons, staff, services
- All writes require authenticated salon membership (checked via `is_salon_member()` SECURITY DEFINER)
- Service role bypasses RLS (used in public booking server functions only)

## Key Architecture Decisions

- **Single-tenant isolation:** Every DB query filters by SALON_ID from env vars. One deployment per salon.
- **Server functions:** All data mutations use `createServerFn`. Public ones use supabaseAdmin (service role). Authenticated ones use `requireSupabaseAuth` middleware.
- **Dynamic imports for server-only modules:** `const { supabaseAdmin } = await import(...)` inside handlers — never top-level.
- **Rate limiting:** Sliding-window limiter keyed by phone number — 3 requests per 5 minutes.
- **Env var pattern:** `VITE_*` for public/client-safe vars. Non-`VITE_` for server-only secrets.

## Styling

- Tailwind CSS v4 with `@theme inline` design tokens + CSS custom properties
- Fonts: Inter (body) + Cormorant Garamond (headings, `.font-display`)
- Color palette: configurable via CSS variables (brand agnostic)
- Custom utilities: `.hairline`, `.tap-target`, `.safe-pb`/`.safe-pt`
- Prettier: 100 print width, double quotes, trailing commas everywhere

## Testing & CI

- **Framework:** Vitest (82 tests covering Zod schemas, env/config helpers, and the rate limiter). Input schemas are exported from `booking.functions.ts` / `admin-crud.functions.ts` and imported by tests — never replicate a schema inline in a test.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)
- Run `bun run test` before pushing

## Data Flow

### Public Booking

`/book` → `createPublicBooking` (`src/lib/booking.functions.ts`): validates input (Zod), checks slot availability via `get_busy_slots` RPC, upserts client by phone, creates booking with `confirmed` status. Sends Twilio SMS + Resend email confirmation. Uses supabaseAdmin (service role) for writes. All payments collected in-studio — no digital payment processing.

### Admin Functions

`src/lib/admin.functions.ts` + `src/lib/admin-crud.functions.ts`: use `requireSupabaseAuth` middleware. Auth-context supabase client respects RLS (scoped to caller's salon membership).

### Slot Availability

`src/lib/salon.ts` → `computeAvailableSlots()`: computes 15-min slots using staff working hours ∩ salon business hours, subtracts existing bookings via `get_busy_slots` RPC with 30-min minimum lead time.

## Error Handling

- `src/server.ts` wraps SSR responses: catches h3-swallowed errors and returns styled error page
- `src/lib/error-capture.ts` captures uncaught errors/rejections globally (5-second TTL)
- React error boundary in `__root.tsx` errorComponent

## Deployment

- Deploy via `bun build` (Vite build with Nitro, Cloudflare target)
- Per-salon env vars: `VITE_SALON_ID`, `VITE_SALON_NAME`, etc. must be set per deployment
- **Vercel uses npm, not Bun** — `package-lock.json` takes priority over `bun.lock` in Vercel's auto-detection. No custom `installCommand` in `vercel.json`. The `prepare` script in `package.json` is `command -v husky > /dev/null 2>&1 && husky || :` to gracefully handle missing husky on CI.
- Twilio webhook endpoint must point to `{APP_URL}/api/twilio-webhook`

## Projects (DO NOT USE DEPRECATED PROJECTS)

### Correct Project (this repo)

- **GitHub:** `donovinsims/nail-lounge-mp` (`git@github.com:donovinsims/nail-lounge-mp.git`)
- **Vercel:** `teamdonovin/nail-lounge-mp` → https://vercel.com/teamdonovin/nail-lounge-mp
- **Temp Domain:** https://nails815.vercel.app

### DEPRECATED — Do Not Use

- **GitHub:** `donovinsims/nail-lounge.git` (old repo — deleted/irrelevant)
- **Vercel:** `teamdonovin/old-nail-lounge` → https://vercel.com/teamdonovin/old-nail-lounge
- **Old URL:** `nail-lounge-demo.vercel.app`

> **CRITICAL:** The Vercel CLI `.vercel/project.json` now points to `teamdonovin/nail-lounge-mp`.
> Always run `vercel link --project nail-lounge-mp --yes` first if you ever switch projects.
> Never modify `old-nail-lounge` project — it is deprecated.

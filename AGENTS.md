# mynails-generic — TanStack Start + Supabase Salon Template

## Project Identity

- **Name:** mynails-generic
- **Framework:** TanStack Start (`@tanstack/react-start`) + Vite 7 + React 19
- **Stack:** Tailwind CSS v4, shadcn/ui (new-york, no RSC), Supabase Auth + PostgreSQL, Stripe, Twilio, Resend
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
bun run format       # prettier --write .
```

## Routes (`src/routes/`)

| Route | File | Description |
|---|---|---|
| `/` | `index.tsx` | Home — featured services, staff cards, hours, map |
| `/services` | `services.tsx` | Full menu (grouped by category dynamically) |
| `/book` | `book.tsx` | Multi-step booking flow (service → staff → time → confirm) |
| `/booking-confirmed` | `booking-confirmed.tsx` | Post-Stripe-checkout landing page |
| `/appointments` | `appointments.tsx` | Phone-based appointment lookup |
| `/auth` | `auth.tsx` | Sign-in |
| `/_authenticated/` | `admin.tsx` + sub-views | Admin area (gated by supabase auth) |

### Admin Sub-Views (imported by admin.tsx, not separate routes)

- `/_authenticated/-admin-dashboard.tsx` — overview with stats
- `/_authenticated/-admin-settings.tsx` — staff/services/hours CRUD
- `/_authenticated/-admin-waitlist.tsx` — waitlist management

Generated file (do not edit by hand): `src/routeTree.gen.ts`

## Key Files

| File | Role |
|---|---|
| `src/lib/env.ts` | Env helpers: `getSalonName()`, `getSalonAddress()`, `getSalonPhone()`, `getSalonSocial()`, `getOGImage()`, `getUmamiWebsiteId()`, `getUmamiHost()`, `getSalonId()`, `isSeedAllowed()`. Reads `VITE_*` env vars with fallbacks. |
| `src/lib/config.server.ts` | Server-only config: `getServerConfig()`, `hasStripe()`, `hasTwilio()`, `hasEmail()`. Reads non-`VITE_` env vars at call time (for CF Workers compat). |
| `src/lib/booking.functions.ts` | `createPublicBooking`, `lookupAppointments`, `cancelPublicBooking`, `verifyCheckoutSession`. Integrates Stripe Checkout (when deposit > 0) and Twilio SMS. Rate-limited: 3 per 5min per phone. |
| `src/lib/admin-crud.functions.ts` | CRUD server fns for staff (`getAllStaffForSalon`, `createStaff`, `updateStaff`, `deleteStaff`), services (`getAllServicesForSalon`, `createService`, `updateService`, `deleteService`), and `updateSalonHours`. All gated by `requireSupabaseAuth`. |
| `src/lib/admin.functions.ts` | `getMyStaff`, `linkSelfToFirstSalon`, `completeBookingWithPayment` (POS), `seedDemoData`. |
| `src/lib/rate-limiter.ts` | Generic sliding-window rate limiter class. |
| `src/lib/email.server.ts` | `sendBookingConfirmation` via Resend. |
| `src/lib/salon.ts` | `computeAvailableSlots` — 15-min slots, 30-min lead time, subtracts busy slots via RPC. |
| `src/lib/error-capture.ts` | Global error capture with 5s TTL. |
| `src/start.ts` | TanStack Start instance + global middleware |
| `src/server.ts` | SSR entry + error normalization |
| `src/router.tsx` | Router + QueryClient setup |

## Supabase Integration

### Client Layers

- `src/integrations/supabase/client` — public anon client (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `src/integrations/supabase/client.server` — service role admin client (`SUPABASE_SERVICE_ROLE_KEY`). Import inside handlers only (`const { supabaseAdmin } = await import(...)`), never at top level.
- `src/integrations/supabase/auth-attacher.ts` — global middleware, attaches Supabase bearer token to `createServerFn` RPC calls.
- `src/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` middleware for server functions.

### Env Variables

| Variable | Scope | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | Yes |
| `SUPABASE_URL` | Server-only | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | For admin ops |
| `VITE_SALON_ID` | Public | Yes |
| `VITE_SALON_NAME` | Public | Yes |
| `STRIPE_SECRET_KEY` | Server-only | For payments |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public | For payments |
| `STRIPE_WEBHOOK_SECRET` | Server-only | For webhooks |
| `TWILIO_ACCOUNT_SID` | Server-only | For SMS |
| `TWILIO_AUTH_TOKEN` | Server-only | For SMS |
| `TWILIO_PHONE_NUMBER` | Server-only | For SMS |
| `RESEND_API_KEY` | Server-only | For email |
| `VITE_UMAMI_WEBSITE_ID` | Public | Optional (analytics) |
| `VITE_UMAMI_HOST` | Public | Optional (analytics) |
| `APP_URL` | Server-only | Yes (CORS/webhooks) |

Server-only values (without `VITE_` prefix) must be read inside a function/handler, not at module scope.

### Supabase Schema (6 migrations)

**Tables:** `salons`, `staff`, `services`, `clients`, `bookings`, `commission_records`, `waitlist_entries`, `floor_status`, `ai_calls`, `profiles`

**Enums:** `app_role` (owner|staff), `booking_status` (confirmed|completed|cancelled|no_show), `floor_state` (with_client|available|offline), `waitlist_status` (active|fulfilled|cancelled)

**Migrations:**
1. Initial schema + RLS + triggers + seed data
2. Staff column additions + full seed
3. Security cleanup — revoke EXECUTE on trigger functions
4. RPC-based bookings read + column-level grants refinement
5. Booking overlap exclusion constraint (exclude booking id from conflict check)
6. Add `stripe_session_id` column to bookings

### RLS Key Points

- `get_busy_slots()` RPC is the public read path for bookings
- Anon can read limited fields of salons, staff, services
- All writes require authenticated salon membership (checked via `is_salon_member()` SECURITY DEFINER)
- Service role bypasses RLS (used in public booking server functions only)

## Key Architecture Decisions

- **Single-tenant isolation:** Every DB query filters by SALON_ID from env vars. One deployment per salon.
- **Server functions:** All data mutations use `createServerFn`. Public ones use supabaseAdmin (service role). Authenticated ones use `requireSupabaseAuth` middleware.
- **Dynamic imports for server-only modules:** `const { supabaseAdmin } = await import(...)` inside handlers — never top-level.
- **Stripe Checkout flow:** `createPublicBooking` creates CheckoutSession when deposit > 0, stores `session_id` on booking, returns `checkoutUrl`. Booking-confirmed page verifies payment on mount.
- **In-person POS:** `createPOSPaymentIntent` (Stripe Elements via CardElement component).
- **Rate limiting:** Sliding-window limiter keyed by phone number — 3 requests per 5 minutes.
- **Env var pattern:** `VITE_*` for public/client-safe vars. Non-`VITE_` for server-only secrets.

## Styling

- Tailwind CSS v4 with `@theme inline` design tokens + CSS custom properties
- Fonts: Inter (body) + Cormorant Garamond (headings, `.font-display`)
- Color palette: configurable via CSS variables (brand agnostic)
- Custom utilities: `.hairline`, `.tap-target`, `.safe-pb`/`.safe-pt`
- Prettier: 100 print width, double quotes, trailing commas everywhere

## Testing & CI

- **Framework:** Vitest (76+ tests covering Zod schemas and env/config)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)
- Run `bun run test` before pushing

## Data Flow

### Public Booking

`/book` → `createPublicBooking` (`src/lib/booking.functions.ts`): validates input (Zod), checks slot availability via `get_busy_slots` RPC, upserts client by phone, creates booking with `pending_payment` status. If deposit > 0 and Stripe configured, creates CheckoutSession and returns `checkoutUrl`. Sends Twilio SMS + Resend email confirmation. Uses supabaseAdmin (service role) for writes.

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
- Stripe webhook endpoint must point to `{APP_URL}/api/stripe-webhook`
- Twilio webhook endpoint must point to `{APP_URL}/api/twilio-webhook`

# Nail Lounge — TanStack Start + Supabase

## Stack

- **Framework:** TanStack Start (`@tanstack/react-start`) + Vite 7 + React 19
- **Routing:** TanStack Router — file-based, NOT Next.js/Remix
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"` syntax) + `tw-animate-css`, shadcn/ui (new-york, no RSC)
- **Auth:** Lovable Cloud Auth (Google OAuth) + Supabase Auth
- **Database:** Supabase PostgreSQL (project: `wjyjgtsaepoxtmalttzj`)
- **Package manager:** Bun (has bun.lock + bunfig.toml; npm lockfile present as artifact)

## Commands

```
bun dev                          # vite dev
bun build                        # vite build
bun run build:dev                # vite build --mode development
bun run lint                     # eslint .
bun run format                   # prettier --write .
bun run preview                  # vite preview
```

No test framework is configured. No CI config exists.

## Key Architecture

### Entrypoints

- `src/start.ts` — creates the TanStack Start instance, registers global middleware (`attachSupabaseAuth`, error middleware)
- `src/server.ts` — SSR entry (deployed as serverless handler). Has custom h3 error normalization
- `src/router.tsx` — creates TanStack Router with QueryClient in context

### Routes (`src/routes/`)

Do NOT create `src/pages/` or `app/layout.tsx`. See `src/routes/README.md` for conventions.

Key routes:

- `/` — home with featured services, artist cards, hours, map
- `/services` — full menu
- `/service` — **legacy typo route**, always redirects to `/services`
- `/book` — multi-step booking flow (service → staff → time → confirm)
- `/auth` — sign-in
- `/appointments` — lookup by phone
- `/_authenticated/` — admin area (gated by `supabase.auth.getUser()`, ssr:false)

Generated files (do not edit by hand): `src/routeTree.gen.ts`, all files under `src/integrations/supabase/` (marked auto-generated)

### Vite Config

Uses `@lovable.dev/vite-tanstack-config` which bundles TanStack Start, React, Tailwind, tsconfig paths, Nitro (Cloudflare target). Do NOT add these plugins manually — pass config via its `defineConfig()` options. Server entry is redirected to `src/server.ts` via `tanstackStart.server.entry`.

### Bun Quirks

- `bunfig.toml` has a 24h supply-chain guard (`minimumReleaseAge = 86400`). New package versions <24h old are rejected.
- `@lovable.dev/*` packages are exempted via `minimumReleaseAgeExcludes`.
- To install a new package published within the last 24h, add it to the excludes list first.

## Supabase Integration

### Client Layers

- `@/integrations/supabase/client` — public anon client (uses `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`). Falls back from `import.meta.env` to `process.env` for SSR.
- `@/integrations/supabase/client.server` — service role admin client (uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). **Bypasses RLS.** Only import inside handlers (dynamic import pattern: `const { supabaseAdmin } = await import(...)`), never at top level outside `.server.ts` modules.
- `@/integrations/supabase/auth-attacher.ts` — registered as global `functionMiddleware` in `src/start.ts`. Attaches Supabase bearer token to `createServerFn` RPC calls. Without this, authenticated server functions will reject.
- `@/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` middleware for server functions. Validates bearer token server-side, passes `{ supabase, userId, claims }` to handler context.

### Env Variables

| Variable                        | Scope                    | Required      |
| ------------------------------- | ------------------------ | ------------- |
| `VITE_SUPABASE_URL`             | Public (client + server) | Yes           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (client + server) | Yes           |
| `SUPABASE_URL`                  | Server-only              | Yes           |
| `SUPABASE_PUBLISHABLE_KEY`      | Server-only              | Yes           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only              | For admin ops |
| `SUPABASE_PROJECT_ID`           | Reference only           | No            |

Server-only values (`SUPABASE_*` without `VITE_` prefix) must be read inside a function/handler, not at module scope — Cloudflare Workers resolve env per-request at runtime (see `src/lib/config.server.ts`). `.server.ts` suffix prevents Vite client bundling.

### DB Schema (public)

Tables: `salons`, `staff`, `services`, `clients`, `bookings`, `commission_records`, `waitlist_entries`, `floor_status`, `ai_calls`, `profiles`

Enums: `app_role` (owner|staff), `booking_status` (confirmed|completed|cancelled|no_show), `floor_state` (with_client|available|offline), `waitlist_status` (active|fulfilled|cancelled)

All tables have RLS + column-level grants. Anon can read filtered columns of salons, staff, services, bookings. All other operations require authenticated salon membership (checked via `is_salon_member()` SECURITY DEFINER function). The initial migration file is the authoritative schema source.

### Key RLS/Security

- `public.get_busy_slots()` RPC is the only public read path for bookings (anon + authenticated can call)
- `public.salons`: anon only sees `id, name, address, phone, business_hours, holiday_schedule, created_at`
- `public.staff`: anon only sees display fields (no auth_user_id, pin, role)
- Trigger functions `handle_new_user()` and `flag_waitlist_on_cancel()` have EXECUTE revoked from public
- Waitlist: when a booking is cancelled, matching waitlist entries get a `flagged_booking_id` reference

### Migrations (4 total)

1. Initial schema + RLS + triggers + seed data
2. Staff column additions + full seed (services, 4 staff, 1 salon)
3. Security cleanup: revoke EXECUTE on trigger functions
4. RPC-based bookings read + column-level grants refinement

## Data Flow

### Public Booking

`/book` → `createPublicBooking` (`src/lib/booking.functions.ts`): validates input, checks slot availability against existing bookings, upserts client by phone, creates booking. Uses `supabaseAdmin` (service role) for writes.

### Admin Functions

`src/lib/admin.functions.ts`: use `requireSupabaseAuth` middleware. Auth-context supabase client respects RLS (scoped to caller's salon membership).

- `getMyStaff` — resolves current user's staff + salon
- `linkSelfToFirstSalon` — demo helper: links auth user as owner of first salon
- `completeBookingWithPayment` — completes booking + creates commission record
- `seedDemoData` — seeds demo bookings + AI call logs for the current salon

### Slot Availability

`src/lib/salon.ts` → `computeAvailableSlots()`: computes 15-min slots using staff working hours ∩ salon business hours, subtracts existing bookings via `get_busy_slots` RPC. 30-min minimum lead time from now.

## Styling

- Tailwind CSS v4 with `@theme inline` for design tokens + CSS custom properties for light/dark
- Fonts: Inter (body) + Cormorant Garamond (headings, `.font-display`)
- Color palette: warm ivory/blush/plum (nail salon theme)
- Custom utilities: `.hairline` (border inset), `.tap-target` (44px min tap area), `.safe-pb`/`.safe-pt` (iOS safe areas)
- Prettier: 100 print width, double quotes, trailing commas everywhere

## Nail Lounge Domain (hardcoded)

`src/lib/salon.ts` → `BUSINESS` constant holds: name "Nail Lounge", address 1513 West Lane Rd Machesney Park IL, phone +1 815-977-3443, email, social links, Booksy/Yelp URLs. These are derived from `BUSINESS` constant, not from the DB `salons` table (except address/hours/phone which come from DB).

## Error Handling

- `src/server.ts` wraps all SSR responses: catches h3-swallowed errors (detects `{"unhandled":true,"message":"HTTPError"}` JSON bodies) and returns a styled error page
- `src/lib/error-capture.ts` captures uncaught errors/rejections at the global level (5-second TTL) so `server.ts` can recover the original stack
- `src/lib/lovable-error-reporting.ts` reports errors to Lovable's error capture when available
- React error boundary in `__root.tsx` errorComponent
- Error page (`renderErrorPage`) is a minimal HTML page with retry/home buttons

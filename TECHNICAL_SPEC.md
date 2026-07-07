# Nail Salon Booking + POS — Technical Specification

> **Project:** Full-stack salon management application (booking, POS, admin dashboard)
> **Source:** Derived from the Nail Lounge production app  
> **Stack:** TanStack Start (React 19) + Supabase (PostgreSQL + Auth)  
> **Audience:** Developers evaluating, purchasing, or extending this template  
> **Status:** Pre-production / MVP — ready for genericization and integration

---

## Table of Contents

1. [Stack & Architecture](#1-stack--architecture)
2. [Project Structure](#2-project-structure)
3. [Data Model](#3-data-model)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Route Map](#5-route-map)
6. [Business Logic Layer](#6-business-logic-layer)
7. [Admin Console Features](#7-admin-console-features)
8. [Security Assessment](#8-security-assessment)
9. [Integration Points](#9-integration-points)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Production Readiness Scorecard](#11-production-readiness-scorecard)
12. [Known Issues & Technical Debt](#12-known-issues--technical-debt)

---

## 1. Stack & Architecture

### Core Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | TanStack Start (React 19) | ^1.114.x | SSR + file-based routing via TanStack Router |
| UI | Tailwind CSS v4 | ^4.0.x | PostCSS-based, shadcn/ui compatible |
| Components | shadcn/ui (Radix primitives) | latest | Button, Card, Dialog, Table, Input, Badge, etc. |
| Icons | Lucide React | ^0.479.x | SVG icon set |
| Charts | Recharts | ^2.x | Dashboard charts only |
| Forms | React Hook Form + Zod | latest | Booking form and admin forms |
| Database | Supabase (PostgreSQL 15) | hosted | Full RLS, realtime, triggers |
| Auth | Supabase Auth (GoTrue) | hosted | Email magic link, anon + service role |
| Hosting | Vercel (Nitro serverless) | — | TanStack Start adapter |
| Runtime | Bun | ^1.x | Build + dev |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  TanStack Router → Routes → Components (SSR → CSR)  │
└──────────────┬─────────────────────────────────┬─────┘
               │ Supabase Auth (anon key)         │ Supabase Realtime
               ▼                                  ▼
┌───────────────────────┐          ┌──────────────────────────┐
│  Supabase PostgreSQL  │ ◄─────── │  Supabase Realtime (WS)  │
│  - RLS policies       │          │  - floor_status          │
│  - Triggers / RPCs    │          │  - bookings              │
│  - 10 tables, 4 enums │          └──────────────────────────┘
└──────┬────────────────┘
       │ Service Role Key (server-side only)
       ▼
┌───────────────────────────────┐
│  Nitro Server (Vercel SSR)    │
│  - Public booking endpoints   │
│  - Admin API helpers          │
│  - Config.server.ts           │
└───────────────────────────────┘
```

**Key architecture decisions:**
- **3-tier Supabase auth:** anon key (public RLS-blessed queries) → service-role key (server functions) → RLS-session (authenticated user queries)
- **File-based routing:** TanStack Router `src/routes/` — all routes are `.tsx` files with lazy loading support
- **Server-only env wrapper** (`config.server.ts`): prevents client-side exposure of service role key
- **No ORM:** Raw Supabase JS client (`supabase.from('table').select(...)`) throughout
- **No state management library:** TanStack Router Search Params + React state for booking wizard; Supabase Realtime for live floor/waitlist

---

## 2. Project Structure

```
mynails/
├── app.config.ts              # TanStack Start config (SSR, server bundling)
├── bun.lock                   # Bun lockfile
├── package.json               # All dependencies
├── postcss.config.ts          # Tailwind v4 + postcss
├── tailwind.config.ts         # CSS-first Tailwind config
├── tsconfig.json              # Strict TS, @/* alias
├── vercel.json                # Vercel deployment config
│
├── public/
│   └── images/
│       ├── nailpolish.jpg     # Hero image (hardcoded)
│       └── salon-interior.jpg # Gallery image (hardcoded)
│
├── supabase/
│   ├── config.toml            # Supabase local config
│   ├── seed.sql               # Seed: Nail Lounge (1 salon, 4 staff, ~60 services)
│   └── migrations/
│       ├── 20240301000001_initial.sql       # Base schema + RLS
│       ├── 20240301000002_profiles.sql       # Profiles table + trigger
│       ├── 20240301000003_hourly_rate.sql    # Commission hourly rate
│       ├── 20240301000004_waitlist.sql       # Waitlist + floor status
│       └── 20240301000005_ai_calls.sql       # AI call logs
│
└── src/
    ├── routeTree.gen.ts       # Auto-generated route tree
    ├── global.css             # Tailwind + global styles
    │
    ├── components/            # shadcn/ui primitives
    │   └── ui/                # Button, Card, Dialog, Table, Input, Badge, etc.
    │
    ├── integrations/
    │   └── supabase/
    │       └── client.ts      # Supabase client factory (anon, admin, auth middleware)
    │
    ├── lib/
    │   ├── salon.ts           # BUSINESS constant (HARDCODED), fetchSalon, fetchServices, fetchStaff, slot computation
    │   ├── booking.functions.ts  # createPublicBooking, lookupAppointments, cancelPublicBooking
    │   ├── admin.functions.ts    # getMyStaff, linkSelfToFirstSalon, completeBookingWithPayment, seedDemoData
    │   ├── config.server.ts      # Server-only env wrapper (SUPABASE_SERVICE_ROLE_KEY)
    │   ├── utils.ts              # Formats, dates, helpers
    │   ├── error-capture.ts      # Error boundary logic
    │   └── error-page.tsx        # Error page component
    │
    └── routes/                # 29 route files
        ├── __root.tsx         # Root layout (SEO JSON-LD, meta tags — HARDCODED)
        ├── index.tsx          # Home/landing page (hero, services, gallery, testimonials — HARDCODED)
        ├── book.tsx           # Multi-step booking wizard
        ├── services.tsx       # Services listing
        ├── service.tsx        # Service detail (redirects)
        ├── gallery.tsx        # Gallery page
        ├── gift-cards.tsx     # Gift cards page
        ├── appointments.tsx   # Appointment lookup by phone
        ├── auth.tsx           # Sign-in page (magic link)
        ├── auth/callback.tsx  # Auth callback handler
        │
        └── _authenticated/    # Guarded by auth middleware
            ├── admin.tsx               # Admin shell (sidebar nav)
            ├── -admin-dashboard.tsx     # KPI cards, charts, seed-data btn
            ├── -admin-calendar.tsx      # Calendar grid (daily view)
            ├── -admin-floor.tsx         # Floor status (Realtime)
            ├── -admin-pos.tsx           # POS terminal (mock)
            ├── -admin-commissions.tsx   # Commission ledger
            ├── -admin-waitlist.tsx      # Waitlist management
            ├── -admin-calls.tsx         # AI call log viewer
            ├── -admin-settings.tsx      # Admin settings
            │
            └── sub-components/
                ├── kpi-card.tsx         # Metric display card
                └── status-badge.tsx     # Status color badge
```

---

## 3. Data Model

### Entity Relationship Summary

```
salons (1) ──┬── staff (N) ──┬── bookings (N)
             │               ├── commission_records (N)
             │               ├── floor_status (1:1)
             │               └── waitlist_entries (N)  ← fulfilled → bookings
             │
             ├── services (N) ──── booking_services (N) → bookings
             │
             ├── clients (N) ──┬── bookings (N)
             │                 └── waitlist_entries (N)
             │
             ├── ai_calls (N) ──── bookings (0..1)
             │
             └── profiles (N) ─── staff.auth_user_id FK
```

### Table Details

| Table | Columns | Key Features |
|-------|---------|-------------|
| **salons** | id (uuid PK), name, slug, address, phone, email, website, social_links (jsonb), settings (jsonb), created_at | Root entity for multi-tenancy |
| **staff** | id (uuid PK), salon_id FK, auth_user_id FK→profiles, name, title, bio, image_url, is_active, sort_order, commission_pct, hourly_rate | Staff membership via salon_id |
| **services** | id (uuid PK), salon_id FK, category, name, description, duration_minutes, price, is_active, sort_order | Salon-scoped services catalog |
| **clients** | id (uuid PK), salon_id FK, name, phone (unique per salon), email, notes, total_visits, last_visit | Client registry per salon |
| **bookings** | id (uuid PK), salon_id FK, staff_id FK, client_id FK, start_time (timestamptz), end_time, status (enum), total_amount, deposit_amount, notes, source, is_walk_in, is_first_visit | Core booking record |
| **booking_services** | id (int PK), booking_id FK, service_id FK, staff_id FK, price_at_time | Line items per booking |
| **commission_records** | id (uuid PK), salon_id FK, staff_id FK, booking_id FK, service_amount, commission_amount, commission_pct, hourly_rate, hours_worked, is_paid | Commission tracking |
| **waitlist_entries** | id (uuid PK), salon_id FK, client_id FK, preferred_staff_id FK, service_ids (uuid[]), party_size, notes, status (enum), position | Waitlist queue |
| **floor_status** | id (int PK), salon_id FK, staff_id FK (unique), state (enum), current_client_name, current_service, started_at | Real-time floor board |
| **ai_calls** | id (uuid PK), salon_id FK, caller_phone, call_time, duration_seconds, transcript_text, summary_text, intent, booking_id FK, successful | AI receptionist logs |
| **profiles** | id (uuid PK, FK→auth.users), email, full_name, avatar_url, role (enum) | Auth user profiles |

### Enums

| Enum | Values |
|------|--------|
| `app_role` | `owner`, `staff` |
| `booking_status` | `confirmed`, `completed`, `cancelled`, `no_show` |
| `floor_state` | `with_client`, `available`, `offline` |
| `waitlist_status` | `active`, `fulfilled`, `cancelled` |

### Row-Level Security (RLS)

All data tables use `is_salon_member()` helper function as the primary gate:

```sql
-- Each query checks: the user's profile has a matching staff.salon_id
is_salon_member() =
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN staff s ON s.auth_user_id = p.id
    WHERE p.id = auth.uid() AND s.salon_id = {TABLE}.salon_id
  )
```

**Policy patterns by operation:**
- **SELECT:** anon can read public columns (salons.name, staff.name, services, etc.); logged-in staff can read all columns via `is_salon_member()`
- **INSERT:** public can insert into bookings/clients with limited columns; staff/owner inserts via `is_salon_member()`
- **UPDATE/DELETE:** staff/owner only via `is_salon_member()`

### Triggers

| Trigger | Action |
|---------|--------|
| `handle_new_user` | Auto-creates profile row on auth.users INSERT |
| `flag_waitlist_on_cancel` | Sets waitlist status=cancelled when a booking is cancelled (no time window check) |

### RPC Functions

| RPC | Signature | Purpose |
|-----|-----------|---------|
| `get_busy_slots(p_salon_id, p_date)` | Returns available slots for a given date | Slot computation for booking flow |

### CRITICAL: Schema Gaps

| Gap | Impact | Fix Priority |
|-----|--------|-------------|
| No `booking_time` exclusion constraint | Double-booking possible | HIGH |
| No `profiles` INSERT RLS | Anyone can create a profile? Risk depends on trigger | MEDIUM |
| `flag_waitlist_on_cancel` too broad | No time-window check before waitlist cancel | LOW |
| No SALON_ID env var | All queries filter by hardcoded UUID | BLOCKER |
| `services` and `staff` have no admin CRUD endpoints | Cannot manage these through UI | HIGH |

---

## 4. Authentication & Authorization

### Auth Flow

```
User → Sign-in (/auth.tsx) → Email magic link → Callback (/auth/callback.tsx)
                                                      │
                                                      ▼
                                               Session created →
                                               Route guard checks
                                               auth().user !== null
```

### Three Supabase Client Tiers

| Client | Usage | Permissions | Where |
|--------|-------|-------------|-------|
| **sbAnon** | Public pages, public bookings | anon key — RLS grants limited SELECT/INSERT | `client.ts` |
| **sbAdmin** | Server-side booking operations | service-role key — bypasses RLS | `config.server.ts` + `booking.functions.ts` |
| **sbServer** | Admin panel queries | service-role key — uses `requireSupabaseAuth` middleware | `admin.functions.ts` |

### Route Protection

- `__root.tsx` → `BeforeLoad` checks auth → redirects to `/auth` if unauthenticated for protected routes
- `_authenticated/` route group — all children inherit auth guard
- Server functions use `requireSupabaseAuth()` helper that asserts `auth().user`

### Security Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Service role key committed in `.env` | **CRITICAL** | `SUPABASE_SERVICE_ROLE_KEY` is in `.env` which is committed |
| `lookupAppointments` no salon_id filter | **HIGH** | Returns appointments across ALL salons |
| `cancelPublicBooking` no salon_id check | **HIGH** | Can cancel bookings across salons |
| `linkSelfToFirstSalon` uses `.limit(1)` | **HIGH** | Links admin to first salon found, ignores real salon context |
| `fetchSalon` uses `.limit(1)` not `.eq('id', ...)` | **MEDIUM** | Multi-salon DB would return wrong salon |
| No rate limiting on public booking endpoint | **MEDIUM** | Potential for spam/dos on booking creation |

---

## 5. Route Map

| Route | File | Auth | Purpose |
|-------|------|------|---------|
| `/` | `index.tsx` | Public | Landing page — hero, services, gallery, testimonials |
| `/book` | `book.tsx` | Public | 4-step booking wizard (service→staff→datetime→confirm) |
| `/services` | `services.tsx` | Public | Services listing by category |
| `/service/:id` | `service.tsx` | Public | Service detail (redirects to book) |
| `/gallery` | `gallery.tsx` | Public | Photo gallery |
| `/gift-cards` | `gift-cards.tsx` | Public | Gift card information |
| `/appointments` | `appointments.tsx` | Public | Lookup by phone number |
| `/auth` | `auth.tsx` | Public | Magic link sign-in |
| `/auth/callback` | `auth/callback.tsx` | Public | Auth callback handler |
| `/admin` | `admin.tsx` | Auth | Admin shell — sidebar nav with 8 tabs |
| `/admin/dashboard` | (tab) | Auth | KPIs, charts, seed data |
| `/admin/calendar` | (tab) | Auth | Daily appointment calendar |
| `/admin/floor` | (tab) | Auth | Real-time floor status board |
| `/admin/pos` | (tab) | Auth | POS terminal (mock) |
| `/admin/commissions` | (tab) | Auth | Commission tracking |
| `/admin/waitlist` | (tab) | Auth | Waitlist management |
| `/admin/calls` | (tab) | Auth | AI call log viewer |
| `/admin/settings` | (tab) | Auth | Admin settings |

---

## 6. Business Logic Layer

### Key Files

#### `src/lib/salon.ts`
- **`BUSINESS` constant** — ALL salon info hardcoded: name, address, phone, email, hours, social links, images
- **`fetchSalon()`** — Queries `salons` table by `.limit(1)` — assumes single salon
- **`fetchServices()`** — Filters by category + active
- **`fetchStaff()`** — Active staff list
- **`computeAvailableSlots()`** — Computes available time slots using `get_busy_slots()` RPC
- **`fmtMoney / fmtTime / fmtDate`** — Formatting helpers

#### `src/lib/booking.functions.ts`
- **`createPublicBooking()`** — Service-role: creates booking + client + booking_services in transaction
- **`lookupAppointments()`** — Service-role: fetches past/future bookings by phone (NO salon_id filter)
- **`cancelPublicBooking()`** — Service-role: updates booking status (NO salon_id check)

#### `src/lib/admin.functions.ts`
- **`getMyStaff()`** — Fetches staff for admin's salon
- **`linkSelfToFirstSalon()`** — Links auth user to first salon found (uses `.limit(1)`)
- **`completeBookingWithPayment()`** — Updates booking status + creates commission record + (mock) payment
- **`seedDemoData()`** — Creates demo data using service role (DANGEROUS — creates real data in production DB)

#### `src/lib/config.server.ts`
- Server-only env wrapper — exports `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SITE_URL`

---

## 7. Admin Console Features

### Dashboard (Readiness: 2/5)
- KPI cards: revenue (today, week, month), bookings, new clients, no-shows
- Revenue chart (7-day + 12-month) using Recharts
- **CRITICAL:** "Seed Demo Data" button writes real data to production DB via service role

### Calendar (Readiness: 3/5)
- Daily view with hourly buckets
- Staff column layout
- **Missing:** Month/week view, drag-to-reschedule, edit events inline

### Floor Management (Readiness: 3/5)
- Real-time via Supabase Realtime subscriptions
- Staff cards with state badges (with_client, available, offline)
- **Missing:** Optimistic UI updates, automatic state transitions

### POS Terminal (Readiness: 1/5)
- 100% mock — uses `setTimeout` to simulate payment
- **NO** Stripe SDK installed
- **NO** actual payment processing
- Checkout logic for service + staff selection
- **Missing:** Real payment gateway, receipt generation, tip handling, refund flow

### Commissions (Readiness: 4/5)
- Best-implemented tab
- Sortable table (date, staff, service, commission amount)
- CSV export
- Pagination
- Per-staff commission rate and hourly rate support

### Waitlist (Readiness: 2/5)
- Add customer to waitlist
- Queue display
- **Missing:** Realtime updates, fulfill → booking conversion, SMS/email notify

### AI Calls (Readiness: 2/5)
- Call log viewer with search/filter
- **Stub data only** — no actual Twilio or AI integration

### Settings (Readiness: 3/5)
- Can edit: salon name, address, phone
- **Cannot edit:** hours, social links, images, staff CRUD, services CRUD

---

## 8. Security Assessment

| Category | Finding | Severity |
|----------|---------|----------|
| **Secrets** | `.env` has committed `SUPABASE_SERVICE_ROLE_KEY` | CRITICAL |
| **Data Isolation** | No SALON_ID env var or query filter | CRITICAL |
| **Tenant Leak** | `lookupAppointments` returns cross-tenants | HIGH |
| **Tenant Leak** | `cancelPublicBooking` no salon cross-check | HIGH |
| **Tenant Confusion** | `linkSelfToFirstSalon` uses `.limit(1)` | HIGH |
| **Data Safety** | Seed Demo Data creates real production data | HIGH |
| **Rate Limiting** | No rate limiting on any endpoint | MEDIUM |
| **Race Condition** | `createPublicBooking` has window for double-booking | MEDIUM |
| **RLS Gap** | `profiles` table missing INSERT/UPDATE policies | MEDIUM |
| **CSRF** | No CSRF tokens on server functions | LOW |
| **XSS** | SSR with proper escaping | LOW |
| **Auth** | Magic link + proper session management | ✅ OK |

---

## 9. Integration Points

| Integration | Current State | Production Requirement |
|-------------|---------------|----------------------|
| **Payment (Stripe)** | None — mock `setTimeout` in POS | Full Stripe Elements SDK, webhooks, refunds |
| **SMS/Email** | None — no Twilio/SendGrid | Booking confirmations, reminders, waitlist notify |
| **AI Receptionist** | None — stub call log viewer | Twilio Voice + LLM (VAPI/Retell/Bland AI) |
| **Webhooks** | None | Stripe webhook, phone status callbacks |
| **Calendar Sync** | None | Google Calendar / iCal export |
| **Reviews** | None (testimonial is hardcoded HTML) | Google Reviews API, Yelp integration |
| **Social Media** | Hardcoded URLs in BUSINESS constant | Admin-configurable links |
| **Maps** | None | Google Maps embed for location |
| **Analytics** | None | Google Analytics / Plausible |

---

## 10. Deployment Architecture

### Current (Vercel + Supabase)

```
Vercel (Nitro)
  ├── tanstack-start build               ← SSR + Static assets
  ├── vercel.json: framework=tanstack-start
  ├── Build: bun run build
  └── Runtime: Node.js (Nitro serverless)
        ├── SSR routes
        └── Server functions (service role)

Supabase Cloud (Project: wjyjgtsaepoxtmalttzj)
  ├── PostgreSQL 15 (10 tables, 4 enums)
  ├── Auth (GoTrue — magic links)
  ├── Realtime (floor_status, bookings)
  └── Storage (none configured yet)
```

### .env Configuration

```env
# Current (committed — DANGEROUS)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # ← COMMITTED!
PUBLIC_SITE_URL=http://localhost:3001

# Required for production (not present)
SALON_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=                 # or SendGrid
VAPI_API_KEY=                   # or Retell/Bland AI
```

### Deployment Steps (Vercel)
1. `bun run build` → TanStack Start SSR bundle
2. Vercel detects framework via `vercel.json`
3. Set all env vars in Vercel dashboard
4. Run migrations via `supabase db push` or manual SQL
5. Configure Supabase Auth → Site URL for magic link redirect

---

## 11. Production Readiness Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| **Public Booking UX** | 4/5 | Strong flow, missing payment + confirmations |
| **Admin Dashboard** | 2/5 | Seed danger, limited real-time data |
| **Admin Calendar** | 3/5 | Functional daily view, missing month/week |
| **Floor Management** | 3/5 | Good Realtime, missing optimistic updates |
| **POS System** | 1/5 | Mock only — payment integration required |
| **Commissions** | 4/5 | Solid — nearest to production-ready |
| **Waitlist** | 2/5 | Basic CRUD, missing realtime + integration |
| **AI Calls** | 0/5 | Stub data only — no integration |
| **Settings** | 3/5 | Partial editing, missing CRUD for staff/services |
| **Security** | 3/5 | RLS good, but service key exposure + tenant leaks |
| **Data Model** | 4/5 | Solid schema, missing constraints |
| **Multi-Tenancy** | 1/5 | Schema-ready but code assumes single tenant |
| **Testing** | 0/5 | None |
| **CI/CD** | 0/5 | None |

**Overall: 2.3/5 — Strong foundation, not production-ready**

---

## 12. Known Issues & Technical Debt

### Blocker Issues

1. **Duplicate project tree** — `mynails/` and `mynails/src/` are identical copies. Need cleanup.
2. **Service role key in committed `.env`** — Rotate immediately and add to `.gitignore`.
3. **No SALON_ID env var** — All DB queries must filter by dynamic salon ID.
4. **Seed data creates real production records** — Must be disabled via env gate or removed.
5. **Race condition in `createPublicBooking`** — No exclusion constraint, window for double-booking slots.
6. **Cross-tenant data leak** in `lookupAppointments` and `cancelPublicBooking`.

### High Priority

7. No admin CRUD for staff (add/remove/edit).
8. No admin CRUD for services (add/edit/remove/reorder).
9. No admin gallery management (add/remove images).
10. No payment integration (Stripe SDK not even installed).
11. No notification system (SMS/email for booking confirmations).
12. No timezone handling (server assumes salon local time).
13. Hardcoded salon reference in `__root.tsx` JSON-LD, meta tags, and 12+ route files.

### Medium Priority

14. Calendar needs month/week views and drag-to-reschedule.
15. Floor status needs optimistic updates and auto-free transitions.
16. Waitlist needs Realtime subscription and fulfill → booking flow.
17. Settings page needs hours, social links, and image management.
18. No test coverage at any level (unit, integration, e2e).
19. No CI/CD pipeline.
20. No rate limiting on public booking endpoint.

### Low Priority

21. No accessibility audit beyond basic ARIA labels on booking.
22. No analytics instrumentation.
23. No PWA/offline support.
24. No search engine optimization for multi-salon deployments.
25. `confirm()` dialog on appointment cancel is unstyled native prompt.

---

## Appendix A: Key File Paths Reference

| File | Purpose | Key Content |
|------|---------|-------------|
| `src/routes/book.tsx` | Booking wizard | 4-step form, sessionStorage, slot computation |
| `src/routes/__root.tsx` | Root layout | JSON-LD, SEO meta, error boundary |
| `src/routes/index.tsx` | Home page | Hero, services grid, gallery, testimonials |
| `src/routes/_authenticated/-admin-commissions.tsx` | Commissions | CSV export, sort, pagination (best tab) |
| `src/routes/_authenticated/-admin-pos.tsx` | POS | Mock payment flow — needs Stripe |
| `src/routes/_authenticated/-admin-floor.tsx` | Floor | Supabase Realtime subscription |
| `src/lib/salon.ts` | Business logic | HARDCODED BUSINESS constant, slot computation |
| `src/lib/booking.functions.ts` | Booking API | Service-role functions for public booking |
| `src/lib/admin.functions.ts` | Admin API | Staff, commission, seed data operations |
| `src/integrations/supabase/client.ts` | Supabase client | 3-tier auth setup |
| `src/lib/config.server.ts` | Server config | Service role key, site URL |
| `supabase/migrations/20240301000001_initial.sql` | Schema | All tables, enums, RLS, triggers |
| `supabase/seed.sql` | Seed data | Nail Lounge seed (1 salon, 4 staff, services) |
| `package.json` | Dependencies | Full dependency list |
| `vercel.json` | Deploy config | TanStack Start framework, bun build |

---

> **Next document:** See [`LLM_SALES_CONTEXT.md`](./LLM_SALES_CONTEXT.md) for positioning and value proposition
> See [`GENERICIZATION_ROADMAP.md`](./GENERICIZATION_ROADMAP.md) for the plan to turn this into a generic template

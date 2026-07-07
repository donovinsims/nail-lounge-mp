# Comprehensive Codebase Audit Report — nail-lounge-mp

**Generated**: July 7, 2026
**Framework**: TanStack Start + Supabase
**Scope**: Full source tree analysis of `/nail-lounge-mp`

---

## Table of Contents

1. [Routes & Pages](#1-routes--pages)
2. [Components Inventory](#2-components-inventory)
3. [Server Functions (`createServerFn`)](#3-server-functions-createserverfn)
4. [Missing / Incomplete Features](#4-missing--incomplete-features)
5. [Accessibility & SEO](#5-accessibility--seo)
6. [Package.json Dependencies](#6-packagejson-dependencies)
7. [Config Files](#7-config-files)
8. [Security Audit](#8-security-audit)
9. [Summary of Findings](#9-summary-of-findings)

---

## 1. Routes & Pages

### Route Map

| Route                                | File                                               | Lines | Type             | Auth |
| ------------------------------------ | -------------------------------------------------- | ----- | ---------------- | ---- |
| `/`                                  | `src/routes/index.tsx`                             | 516   | Public           | No   |
| `/services`                          | `src/routes/services.tsx`                          | 165   | Public           | No   |
| `/service`                           | `src/routes/service.tsx`                           | 9     | Redirect         | No   |
| `/book`                              | `src/routes/book.tsx`                              | 479   | Public           | No   |
| `/booking-confirmed`                 | `src/routes/booking-confirmed.tsx`                 | 26    | Public           | No   |
| `/appointments`                      | `src/routes/appointments.tsx`                      | 121   | Public           | No   |
| `/auth`                              | `src/routes/auth.tsx`                              | 119   | Public           | No   |
| `/auth/callback`                     | `src/routes/auth/callback.tsx`                     | 41    | Public (SSR off) | No   |
| `/gift-cards`                        | `src/routes/gift-cards.tsx`                        | 174   | Public           | No   |
| `/gallery`                           | `src/routes/gallery.tsx`                           | 136   | Public           | No   |
| `/terms`                             | `src/routes/terms.tsx`                             | 187   | Public           | No   |
| `/privacy`                           | `src/routes/privacy.tsx`                           | 157   | Public           | No   |
| `/_authenticated`                    | `src/routes/_authenticated/route.tsx`              | 12    | Protected        | Yes  |
| `/_authenticated/admin`              | `src/routes/_authenticated/admin.tsx`              | 310   | Protected        | Yes  |
| `/_authenticated/staff`              | `src/routes/_authenticated/staff.tsx`              | 64    | Protected        | Yes  |
| `/_authenticated/staff/`             | `src/routes/_authenticated/staff/index.tsx`        | 206   | Protected        | Yes  |
| `/_authenticated/staff/appointments` | `src/routes/_authenticated/staff/appointments.tsx` | 113   | Protected        | Yes  |

### Admin Sub-Views (tabs within `/admin`)

| Tab Component | File                     | Lines | Description                           |
| ------------- | ------------------------ | ----- | ------------------------------------- |
| Dashboard     | `-admin-dashboard.tsx`   | 445   | KPI cards, charts, schedule           |
| Calendar      | `-admin-calendar.tsx`    | 258   | Multi-staff grid                      |
| Floor         | `-admin-floor.tsx`       | 99    | Live status cycling                   |
| Commissions   | `-admin-commissions.tsx` | 237   | Payroll ledger with CSV export        |
| Alerts        | `-admin-alerts.tsx`      | 288   | Owner alerts + customer history table |
| Waitlist      | `-admin-waitlist.tsx`    | 114   | Add/list waitlist entries             |
| Calls         | `-admin-calls.tsx`       | 110   | AI call log                           |
| Settings      | `-admin-settings.tsx`    | 468   | Staff/services/hours CRUD             |

### Booking Sub-Components (imported by `book.tsx`)

| Component           | File                         | Lines | Description                      |
| ------------------- | ---------------------------- | ----- | -------------------------------- |
| StepService         | `-step-service.tsx`          | 93    | Service selection (radio group)  |
| StepStaff           | `-step-staff.tsx`            | 91    | Staff selection (radio group)    |
| StepDateTime        | `-step-datetime.tsx`         | 108   | Date scroller + time slots       |
| StepConfirm         | `-step-confirm.tsx`          | 204   | Order summary + client info form |
| BookingSummary      | `-booking-summary.tsx`       | 41    | Sidebar summary card             |
| BookingStepProgress | `-booking-step-progress.tsx` | 75    | Step progress indicator          |

### Admin Shared Components

| Component   | File                                 | Lines |
| ----------- | ------------------------------------ | ----- |
| KpiCard     | `-admin-components/kpi-card.tsx`     | 61    |
| StatusBadge | `-admin-components/status-badge.tsx` | 54    |

---

### Per-Route Analysis

#### `/` — Home (`index.tsx`)

- **Sections rendered**: Hero, Marquee strip, Story, Services preview (hardcoded), Staff cards, Gallery preview (hardcoded images), Testimonial, Visit+Hours, CTA band
- **Data fetching**: `useQuery` for `fetchSalon`, `fetchStaff`
- **Error/loading**: No loading spinner — `staff` defaults to `[]`
- **Mobile responsive**: Yes — responsive grid, `sm:`, `md:`, hidden classes; `tap-target` on CTA
- 🟡 **Warning**: `FEATURED_SERVICES` is hardcoded (`index.tsx:56-63`) — not fetched from DB. Home page will show different services than the `/services` page if DB data differs.

#### `/services` — Service Menu

- **Data fetching**: `useQuery` for `fetchSalon`, `fetchServices` — grouped dynamically by category
- **Error/loading**: No explicit loading state, defaults to `[]`
- **Mobile**: Mobile sticky CTA bar with `safe-pb`, spacer div
- 🟢 **Info**: Category grouping is dynamic from DB — good pattern

#### `/book` — Booking Flow

- **Data fetching**: `useQuery` for salon, services, staff, slots; `useServerFn` + `useMutation` for creating booking
- **State**: Multi-step wizard (4 steps), `sessionStorage` persistence, `beforeunload` guard, 300ms debounce on date changes
- **Validation**: Zod `searchSchema` for URL params; client-side phone/name validation in StepConfirm
- **ARIA**: `role="radiogroup"`, `aria-label`, `aria-current="step"`, `aria-live="polite"` announcements, `role="alert"` on errors
- **Mobile**: Step progress with mobile labels, mobile booking summary chips (`md:hidden`), sticky bottom bar, `safe-pb`, `tap-target`
- 🟡 **Warning**: The `remaining-fixes.md` describes 11 known issues with booking UX that were documented but not all verified as fixed

#### `/appointments` — Phone-based Lookup

- **Data fetching**: `lookupAppointments` server fn + mutation; `cancelPublicBooking` mutation
- **Loading**: Skeleton pulse placeholders (3 items)
- **Mobile**: Simple responsive layout with `safe-pt`
- 🟢 **Info**: Good loading skeleton pattern

#### `/gallery` — Gallery

- **Data**: Static imports — 7 hardcoded images
- **Components**: `InstagramEmbed`, `TikTokEmbed` (lazy-loaded via Intersection Observer)
- 🟡 **Warning**: Two identical TikTok links in the header (`gallery.tsx:69-83`), TikTok link duplicated

#### `/gift-cards` — Gift Cards & Parties

- **Data**: Fully hardcoded — static amounts, static occasions
- 🟢 **Info**: Decent content page, uses env helpers for contact

#### `/terms` & `/privacy` — Legal pages

- **Data**: Static content with env helper injection
- 🟡 **Warning**: `privacy.tsx:136,139` — uses `import.meta.env.VITE_SALON_PHONE` and `VITE_SALON_EMAIL` directly instead of through the `getSalonPhone()` / `getSalonSocial().email` helpers from `env.ts`

#### `/auth` — Sign In

- **Auth methods**: Magic link (email OTP) + Google OAuth
- **Simple**: No `useServerFn`, direct `supabase.auth` calls
- 🟢 **Info**: Clean magic link flow

#### `/auth/callback` — Auth callback

- **SSR disabled**: `ssr: false`
- Logic: Listens for auth state change + immediate `getSession()`
- 🟢 **Info**: Good dual-path approach

#### `/admin` — Admin Panel (gated by `_authenticated` layout)

- **Auth**: `_authenticated/route.tsx` checks `supabase.auth.getUser()`, redirects to `/auth`
- **Tabs**: 8 tabs with sidebar navigation, mobile bottom nav (4 tabs)
- **Data**: `useQuery` for `myStaff`, `getOwnerAlerts`; auto-links to salon if no staff record
- **Loading states**: Spinner while loading, error state with retry/sign-out, linking state
- **Mobile**: Bottom nav (4 tabs), responsive sidebar collapse
- 🟡 **Warning**: Mobile bottom nav only shows 4 of 8 tabs — remaining tabs require tapping a specific tab, but there's no "more" button or scroll. Users can't access Commissions, Waitlist, Calls, or Settings on mobile.

#### `/staff` — Staff Portal

- **Layout**: Fixed header with nav links to Dashboard and Appointments
- **Dashboard**: Lockout modal for pending completions, then simple empty state
- **Data**: `getPendingCompletions`, `completeStaffModal` server functions
- **Mobile**: Responsive but minimal styling

---

## 2. Components Inventory

### Shared Components (`src/components/`)

| Component      | File                 | Lines | Usage                       | Notes                                 |
| -------------- | -------------------- | ----- | --------------------------- | ------------------------------------- |
| SiteHeader     | `site-chrome.tsx`    | 57    | All public pages            | Sticky, backdrop blur, responsive nav |
| SiteFooter     | `site-chrome.tsx`    | 122   | All public pages            | Responsive grid, social links         |
| MapEmbed       | `site-chrome.tsx`    | 12    | Home page                   | Google Maps iframe, lazy-loaded       |
| InstagramEmbed | `social-embeds.tsx`  | 33    | Gallery page                | Intersection Observer lazy loading    |
| TikTokEmbed    | `social-embeds.tsx`  | 36    | Gallery page                | Intersection Observer lazy loading    |
| ThemeProvider  | `theme-provider.tsx` | 16    | Root layout                 | Light-only, forces light mode         |
| BottomSheet    | `bottom-sheet.tsx`   | 49    | **(not imported anywhere)** | Uses Vaul drawer — dead code          |

### shadcn/ui Components Present

All located in `src/components/ui/` — **37 component files total**:

Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, InputOtp, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

🟡 **Warning**: Many shadcn components installed but **not used**:

- `input-otp.tsx` — Not referenced anywhere in source
- `pagination.tsx` — Only used inline in `-admin-commissions.tsx` (built manually, not via this component)
- `resizable.tsx` — Not referenced anywhere
- `menubar.tsx` — Not referenced anywhere
- `context-menu.tsx` — Not referenced anywhere
- `breadcrumb.tsx` — Not referenced anywhere
- `hover-card.tsx` — Not referenced anywhere
- `toggle.tsx`, `toggle-group.tsx` — Not referenced anywhere
- `carousel.tsx` — Not referenced anywhere

### Chart/Recharts Usage

- **File**: `-admin-dashboard.tsx` — `BarChart`, `PieChart` (donut) with `ChartContainer`, `ChartTooltip`, `ChartLegend`
- **File**: `src/components/ui/chart.tsx` — shadcn chart wrapper around Recharts

🟢 **Info**: Recharts v2.15.4 is used only in admin dashboard — not bundled for public routes.

### Key Patterns

- **Styling**: All Tailwind CSS v4, no inline style objects other than dynamic background colors (`style={{ background: ... }}`)
- **`cn()` utility**: Used consistently for conditional class merging via `clsx` + `tailwind-merge`
- **`tap-target`**: Custom utility used on interactive elements for mobile touch targets
- **`safe-pb` / `safe-pt`**: Custom utilities for safe area insets

---

## 3. Server Functions (`createServerFn`)

### Complete Inventory (26 total across 4 files)

#### `src/lib/booking.functions.ts` — 6 server fns

| Function                | Method | Zod Validation                                                                                                                                   | Description                                                                                                                                 |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createPublicBooking`   | POST   | ✅ `salonId, serviceId, staffId` (uuid), `startTime` (string), `clientName` (1-100 chars), `clientPhone` (regex), `clientEmail` (optional email) | Rate-limited (3/5min per phone), validates service exists, conflict check, upserts client, creates booking, sends Twilio SMS + Resend email |
| `lookupAppointments`    | POST   | ✅ `phone` (regex), `salonId` (uuid)                                                                                                             | Fetches bookings by client phone                                                                                                            |
| `getPendingCompletions` | GET    | ✅ `staffId` (string)                                                                                                                            | Uncompleted past bookings for staff modal                                                                                                   |
| `completeStaffModal`    | POST   | ✅ `bookingId` (uuid), `tipAmount` (number >=0), `paymentMethod` (enum), `serviceNotes` (string)                                                 | Marks booking completed, inserts commission record, fires rating SMS                                                                        |
| `getStaffAppointments`  | GET    | ✅ `staffId` (string)                                                                                                                            | Upcoming staff appointments                                                                                                                 |
| `cancelPublicBooking`   | POST   | ✅ `bookingId` (uuid), `phone` (regex), `salonId` (uuid)                                                                                         | Phone-verified cancellation                                                                                                                 |

#### `src/lib/admin-crud.functions.ts` — 10 server fns (all use `requireSupabaseAuth`)

| Function                 | Method | Zod Validation                                                          | Description                          |
| ------------------------ | ------ | ----------------------------------------------------------------------- | ------------------------------------ |
| `getAllStaffForSalon`    | GET    | ❌ None                                                                 | Auth-scoped staff list               |
| `createStaff`            | POST   | ✅ `name`, `role` (enum), `workingHours`, `avatarColor`                 | Insert staff                         |
| `updateStaff`            | POST   | ✅ `id` (uuid), partial fields                                          | Update staff                         |
| `deleteStaff`            | POST   | ✅ `id` (uuid)                                                          | Soft-delete (sets `is_active=false`) |
| `getAllServicesForSalon` | GET    | ❌ None                                                                 | Auth-scoped service list             |
| `createService`          | POST   | ✅ `name`, `category`, `durationMinutes`, `price`, `bufferAfterMinutes` | Insert service                       |
| `updateService`          | POST   | ✅ `id` (uuid), partial fields                                          | Update service                       |
| `deleteService`          | POST   | ✅ `id` (uuid)                                                          | Soft-delete                          |
| `updateSalonHours`       | POST   | ✅ `businessHours`, `holidaySchedule`                                   | Update salon hours                   |

#### `src/lib/admin.functions.ts` — 3 server fns (all use `requireSupabaseAuth`)

| Function               | Method | Zod Validation | Description                         |
| ---------------------- | ------ | -------------- | ----------------------------------- |
| `getMyStaff`           | GET    | ❌ None        | Get staff by `auth_user_id`         |
| `linkSelfToFirstSalon` | POST   | ❌ None        | Auto-link auth user as owner        |
| `seedDemoData`         | POST   | ❌ None        | Generate demo data (first-run only) |

#### `src/lib/owner-alerts.functions.ts` — 3 server fns (all use `requireSupabaseAuth`)

| Function             | Method | Zod Validation      | Description                              |
| -------------------- | ------ | ------------------- | ---------------------------------------- |
| `getOwnerAlerts`     | GET    | ❌ None             | Fetch owner alerts                       |
| `acknowledgeAlert`   | POST   | ✅ `alertId` (uuid) | Mark alert acknowledged                  |
| `getCustomerHistory` | GET    | ❌ None             | Client history with booking aggregations |

### Key Observations

- 🟢 **Info**: 17 of 26 server fns have Zod input validation
- 🟢 **Info**: Rate limiting via DB-backed sliding window on `createPublicBooking`
- 🟡 **Warning**: 7 functions have **NO Zod input validation** — `getAllStaffForSalon`, `getAllServicesForSalon`, `getMyStaff`, `linkSelfToFirstSalon`, `seedDemoData`, `getOwnerAlerts`, `getCustomerHistory`
- 🟢 **Info**: All CRUD mutations use `requireSupabaseAuth` middleware
- 🟢 **Info**: Service role (`supabaseAdmin`) is always dynamically imported, never at top level
- 🟡 **Warning**: `seedDemoData` has no Zod validation and no `isSeedAllowed()` guard — relies only on existing booking count check

---

## 4. Missing / Incomplete Features

### TODO/FIXME Comments

- 🟢 **Info**: No `TODO`, `FIXME`, `HACK`, `XXX`, or `@ts-*` comments found in source code — codebase is clean of developer debt markers.

### Known Fixes (documented in `remaining-fixes.md` but not verified as applied)

The `remaining-fixes.md` file (907 lines) documents 11 High, 8 Medium, and 11 Low severity issues.

**🟡 Warning — HIGH severity documented issues:**

- H1: Loading states show false empty states before data arrives (services default to `[]`, not `null`)
- H2: Stale slot state persists when changing service/staff
- H3: Selected item visual feedback too subtle
- H4: Disabled buttons have no explanation when tapped
- H5: Auto-advance on selection without undo

**🟡 Warning — MEDIUM:**

- M7: Validation errors not announced to screen readers (documented as fixed in some areas, need verification)
- M8: Inconsistent press states between service and staff cards

### Empty / Placeholder Components

🟡 **Warning**: `BottomSheet` component (`src/components/bottom-sheet.tsx`) — appears to never be imported anywhere in the codebase (no grep matches). It's dead code.

### Hardcoded Data vs Database-Driven

| Feature                        | Status                             | Location                                                                                               |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Featured services on home page | 🔴 **Hardcoded**                   | `index.tsx:56-63`                                                                                      |
| Gallery images                 | 🟡 **Hardcoded**                   | `gallery.tsx:14-22`, `index.tsx:353-358`                                                               |
| Staff avatars                  | 🟡 **Letter avatars** (not images) | `index.tsx:293-296` — uses `avatar_color` but no actual images, even though `avatar_url` column exists |
| Gift card amounts              | 🟡 **Hardcoded**                   | `gift-cards.tsx:26`                                                                                    |
| Party occasions                | 🟡 **Hardcoded**                   | `gift-cards.tsx:28-45`                                                                                 |
| Testimonial                    | 🟡 **Hardcoded**                   | `index.tsx:387-393`                                                                                    |
| Marquee strip text             | 🟡 **Hardcoded**                   | `index.tsx:174-185`                                                                                    |
| Hours on home page             | 🟢 **DB-driven**                   | Via `fetchSalon`                                                                                       |
| Services page                  | 🟢 **DB-driven**                   | Via `fetchServices`                                                                                    |
| Staff page                     | 🟢 **DB-driven**                   | Via `fetchStaff`                                                                                       |
| "Est." year                    | 🟡 **Parsed from address**         | `index.tsx:111-115` — fragile heuristic                                                                |

### Commented-Out Code

- No commented-out code blocks found via grep

### 🟡 Missing Features

- **No "no_show" UI anywhere**: The `booking_status` enum includes `no_show`, but no UI or admin action exists to mark a booking as no-show
- **No image upload for staff**: `avatar_url` column exists but no staff avatar upload UI
- **No service editing in admin**: `updateService` exists but Settings page doesn't use it (only toggle active and delete)
- **No staff working hours editing in admin**: `updateStaff` supports `workingHours` but the Settings form doesn't include it
- **No booking rescheduling**: Public booking only allows cancellation, not reschedule
- **No iCalendar/Calendar export**: No `.ics` download or Google Calendar link in confirmation

---

## 5. Accessibility & SEO

### Meta Tags Per Route

| Route                | Title                                                 | Description       | OG Tags                                             | Canonical |
| -------------------- | ----------------------------------------------------- | ----------------- | --------------------------------------------------- | --------- |
| `__root` (layout)    | ✅ `getSalonName() — Book your appointment`           | ✅                | ✅ og:title, og:description, og:image, twitter card | No (root) |
| `/`                  | ✅ `getSalonName() — Manicures, Pedicures & Nail Art` | ✅                | ✅ og:title, og:description, og:image, og:url       | ✅        |
| `/services`          | ✅ `Services & Pricing — getSalonName()`              | ✅                | ✅                                                  | ✅        |
| `/book`              | ✅ `Book — getSalonName()`                            | ✅                | ❌ No og tags                                       | ❌        |
| `/booking-confirmed` | 🔴 **NO title/meta at all**                           | ❌                | ❌                                                  | ❌        |
| `/appointments`      | ✅ `My appointments — getSalonName()`                 | ❌ No description | ❌                                                  | ❌        |
| `/auth`              | ✅ `Sign in — getSalonName() Admin`                   | ❌                | ❌                                                  | ❌        |
| `/gift-cards`        | ✅                                                    | ✅                | ✅                                                  | ✅        |
| `/gallery`           | ✅                                                    | ✅                | ✅                                                  | ✅        |
| `/terms`             | ✅                                                    | ✅                | ✅                                                  | ✅        |
| `/privacy`           | ✅                                                    | ✅                | ✅                                                  | ✅        |
| `/admin`             | ✅ `Admin — getSalonName()`                           | ❌                | ❌                                                  | ❌        |
| `/staff/*`           | 🔴 **NO title/meta** (all staff routes)               | ❌                | ❌                                                  | ❌        |

**🔴 Critical**: `/booking-confirmed` and `/staff/*` routes have NO head/meta configuration at all. They'll inherit the root title "Book your appointment" which is misleading.

### Alt Text on Images

- **Hero image** (`index.tsx:155`): ✅ Descriptive alt text
- **Gallery images** (`index.tsx:358-370`, `gallery.tsx:91-103`): ✅ All have alt text
- **Staff avatars**: ❌ No `<img>` used — letter avatars via CSS in `index.tsx:293-296`, `-step-staff.tsx:66-71`, admin views
- 🟡 **Warning**: Staff avatar initials are `aria-hidden="true"` on some but not all renderings

### Semantic HTML

- ✅ `<header>`, `<footer>`, `<section>`, `<article>`, `<nav>`, `<blockquote>` used consistently
- ✅ `role="radiogroup"` on selection lists
- ✅ `role="alert"` on error messages (StepConfirm)
- ✅ `aria-label`, `aria-current` on step progress
- ✅ `aria-live="polite"` for booking announcements
- ❌ **No `<main>` tag used in most pages** — `<div>` containers used instead
- ❌ **No skip-to-content link**

### ARIA Patterns

🟢 **Good**:

- Step progress uses `aria-current="step"`, `aria-label`
- Confirm step uses `aria-invalid`, `aria-describedby`, `role="alert"`
- Step announcements via `aria-live="polite"` with `sr-only`

🟡 **Needs improvement**:

- No `aria-label` on the mobile bottom nav in admin
- No `role="navigation"` on the admin sidebar
- The `aria-live` region was moved outside the step content per remaining-fixes.md — needs verification

### Structured Data

- 🟢 **Info**: JSON-LD structured data in `__root.tsx:110-120` — `NailSalon` schema with name, image, phone, email, priceRange

---

## 6. Package.json Dependencies

### Dependencies (production: 44)

| Package                               | Version            | Notes                                                 |
| ------------------------------------- | ------------------ | ----------------------------------------------------- |
| `@tanstack/react-start`               | ^1.167.50          | Latest-ish (Jan 2026)                                 |
| `@tanstack/react-router`              | ^1.168.25          | Latest-ish                                            |
| `@tanstack/react-query`               | ^5.83.0            | Latest-ish                                            |
| `recharts`                            | ^2.15.4            | ✅ Current                                            |
| `zod`                                 | ^3.24.2            | ✅ Current                                            |
| `react` ^19.2.0 / `react-dom` ^19.2.0 | ✅ Latest React 19 |
| `twilio`                              | ^6.0.2             | ✅ Current                                            |
| `resend`                              | ^6.14.0            | ✅ Current                                            |
| `@supabase/supabase-js`               | ^2.108.2           | ✅ Current                                            |
| `tailwindcss`                         | ^4.2.1             | ✅ Latest v4                                          |
| `lucide-react`                        | ^0.575.0           | ✅ Current                                            |
| `date-fns`                            | ^4.1.0             | ✅ Current                                            |
| `sonner`                              | ^2.0.7             | ✅ Current                                            |
| `vaul`                                | ^1.1.2             | ✅ Current                                            |
| `embla-carousel-react`                | ^8.6.0             | ✅ Current but 🟡 `carousel.tsx` installed but unused |

### DevDependencies (12)

| Package      | Version         | Notes                                        |
| ------------ | --------------- | -------------------------------------------- |
| `typescript` | ^5.8.3          | ✅ Current                                   |
| `vite`       | ^7.3.1          | ✅ Latest v7                                 |
| `vitest`     | ^4.1.9          | ✅ Current                                   |
| `nitro`      | 3.0.260603-beta | 🟡 **Beta version** — could have instability |
| `eslint`     | ^9.32.0         | ✅ Current                                   |
| `prettier`   | ^3.7.3          | ✅ Current                                   |

### 🟡 Observations

- `nitro@3.0.260603-beta` — using a beta version, potential for breaking changes in production builds
- No `@types/node` version mismatch
- No deprecated packages detected
- `package-lock.json` and `bun.lock` both present — **dual lockfile risk**

---

## 7. Config Files

### `tsconfig.json`

- **✅ Strict mode enabled** (`"strict": true`)
- `"noUnusedLocals": false`, `"noUnusedParameters": false` — 🟡 These are off, allowing dead code
- `"noUncheckedSideEffectImports": true` — ✅ Good
- `"verbatimModuleSyntax": false` — 🟢 Pragmatic choice
- Path alias `@/*` configured — ✅

### `vite.config.ts`

- **Plugins**: `tailwindcss()`, `tsconfigPaths()`, `tanstackStart()`, `nitro()`, `react()`
- ✅ `react-dedupe` configured
- 🟡 Ordering: `nitro()` is called after `tanstackStart()` — both are Nitro-based plugins, could conflict
- 🟡 No `mode` conditional configuration

### `eslint.config.js`

- **Flat config** (ESLint 9 format) ✅
- **Rules**:
  - `@typescript-eslint/no-explicit-any: "error"` — ✅ Good, recently added per CHANGES
  - `@typescript-eslint/no-unused-vars: "off"` — 🟡 Disables catch for dead code
  - `react-refresh/only-export-components: "warn"` — ✅
- **Ignores**: Comprehensive (dist, .output, .vinxi, .ctx, etc.)
- **No-restricted-imports**: Blocks `server-only` package — ✅ Good for TanStack Start compatibility

### `.prettierrc`

- Simple: `printWidth: 100`, `semi: true`, `singleQuote: false`, `trailingComma: "all"`
- ✅ Matches project conventions

### `vercel.json`

- Minimal: `buildCommand` + `framework: "tanstack-start"`
- ✅ Uses NITRO_PRESET=vercel in build command

### `vitest.config.ts`

- ✅ Path alias resolves `@/` to `./src`
- ✅ Node environment (appropriate for server function tests)
- ✅ Includes `*.test.ts` and `*.test.tsx`

---

## 8. Security Audit

### Auth Patterns

- **✅ `requireSupabaseAuth` middleware**: Used for all admin/staff operations
- **✅ Service role only in dynamic imports**: Never at module scope in route files
- **✅ Token-based auth**: Bearer token attached via global middleware (`auth-attacher.ts`)
- **✅ Auth state listener**: Root component invalidates router on SIGNED_IN/OUT

### Environment Variables

- **✅ `VITE_` prefix pattern**: Public vars clearly separated from server-only
- **✅ `.env.example`**: Committed without secrets
- **🔴 `.env.example`**: Contains hardcoded Supabase project URL (`ecqztajukteergupvrkg.supabase.co`) — information disclosure risk
- **🟡 `privacy.tsx`**: References `import.meta.env.VITE_SALON_PHONE` and `VITE_SALON_EMAIL` directly rather than through env helper functions — bypasses fallback logic

### Rate Limiting

- **✅ DB-backed sliding window**: Rate limiter uses Postgres RPC `check_rate_limit`
- **✅ Falls open on RPC failure**: Returns `allowed: true` if RPC errors
- **✅ 3 requests per 5 minutes per phone**: For public booking

---

## 9. Summary of Findings

### 🔴 Critical (3)

1. **`/booking-confirmed` has NO head/meta tags** — misleading title from root inherited
2. **Staff routes have NO head/meta tags** — `/staff`, `/staff/appointments` untitled
3. **Hardcoded Supabase project URL in `.env.example`** — information disclosure risk

### 🟡 Warnings (15)

1. **Hardcoded featured services** on home page — diverges from DB
2. **Duplicate TikTok link** in gallery header
3. **`privacy.tsx` uses raw `import.meta.env`** instead of env helpers
4. **Mobile admin nav only shows 4/8 tabs** — no way to access other tabs
5. **Dead code: `BottomSheet` component** never imported
6. **Dead code: 10+ unused shadcn components** (input-otp, resizable, menubar, etc.)
7. **7 server fns have no Zod validation** (getAllStaffForSalon, getAllServicesForSalon, getMyStaff, linkSelfToFirstSalon, seedDemoData, getOwnerAlerts, getCustomerHistory)
8. **`seedDemoData` no `isSeedAllowed()` guard** — relies only on booking count check
9. **11 documented HIGH-severity mobile booking issues** in `remaining-fixes.md` — not verified as fixed
10. **Nitro beta version** — potential production instability
11. **`noUnusedLocals` and `noUnusedParameters` off** — allows dead code
12. **No `<main>` landmark on most pages**
13. **No skip-to-content link**
14. **No "no_show" UI anywhere** — enum value exists but no action
15. **Dual lockfiles** (`package-lock.json` + `bun.lock`)

### 🟢 Info (12)

1. Comprehensive Zod validation on 17/26 server fns
2. Good ARIA patterns on booking flow (radiogroup, alerts, announcements)
3. JSON-LD structured data on root
4. Rate limiting on public booking
5. All admin mutations auth-gated
6. Dynamic env helpers pattern well-designed
7. Service role only dynamically imported
8. Good loading skeletons on appointments page
9. Responsive patterns across all public pages
10. Consistent Tailwind CSS v4 usage
11. Clean codebase — no TODO/FIXME comments
12. 82+ unit tests for Zod schemas

---

## Appendix: All Files Inspected

### Routes (17 files)

- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/services.tsx`
- `src/routes/service.tsx`
- `src/routes/book.tsx`
- `src/routes/booking-confirmed.tsx`
- `src/routes/appointments.tsx`
- `src/routes/auth.tsx`
- `src/routes/auth/callback.tsx`
- `src/routes/gift-cards.tsx`
- `src/routes/gallery.tsx`
- `src/routes/terms.tsx`
- `src/routes/privacy.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/routes/_authenticated/admin.tsx`
- `src/routes/_authenticated/staff.tsx`
- `src/routes/_authenticated/staff/index.tsx`
- `src/routes/_authenticated/staff/appointments.tsx`

### Booking Sub-Components (6 files)

- `src/routes/_booking/-step-service.tsx`
- `src/routes/_booking/-step-staff.tsx`
- `src/routes/_booking/-step-datetime.tsx`
- `src/routes/_booking/-step-confirm.tsx`
- `src/routes/_booking/-booking-summary.tsx`
- `src/routes/_booking/-booking-step-progress.tsx`

### Admin Sub-Components (8 files)

- `src/routes/_authenticated/-admin-dashboard.tsx`
- `src/routes/_authenticated/-admin-calendar.tsx`
- `src/routes/_authenticated/-admin-floor.tsx`
- `src/routes/_authenticated/-admin-commissions.tsx`
- `src/routes/_authenticated/-admin-alerts.tsx`
- `src/routes/_authenticated/-admin-waitlist.tsx`
- `src/routes/_authenticated/-admin-calls.tsx`
- `src/routes/_authenticated/-admin-settings.tsx`

### Admin Shared Components (2 files)

- `src/routes/_authenticated/-admin-components/kpi-card.tsx`
- `src/routes/_authenticated/-admin-components/status-badge.tsx`

### Lib (12 files)

- `src/lib/env.ts`
- `src/lib/config.server.ts`
- `src/lib/booking.functions.ts`
- `src/lib/admin-crud.functions.ts`
- `src/lib/admin.functions.ts`
- `src/lib/owner-alerts.functions.ts`
- `src/lib/salon.ts`
- `src/lib/rate-limiter.ts`
- `src/lib/email.server.ts`
- `src/lib/twilio.server.ts`
- `src/lib/twilio-webhook.server.ts`
- `src/lib/error-capture.ts`

### Components (6 files)

- `src/components/site-chrome.tsx`
- `src/components/social-embeds.tsx`
- `src/components/theme-provider.tsx`
- `src/components/bottom-sheet.tsx`
- `src/components/ui/*` (37 shadcn component files)

### Config Files (6 files)

- `tsconfig.json`
- `vite.config.ts`
- `eslint.config.js`
- `.prettierrc`
- `vercel.json`
- `vitest.config.ts`

### Entry/Setup (4 files)

- `src/start.ts`
- `src/server.ts`
- `src/router.tsx`
- `src/routeTree.gen.ts`

### Integration (4 files)

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/auth-middleware.ts`

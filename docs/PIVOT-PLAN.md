# Strategic Pivot Plan: Scheduling, CRM, Staff Accountability & Reputation Engine

> **Status:** Approved — Phase 1 in execution
> **Date:** July 2026
> **Owner:** Engineering Lead
>
> This document is the **single source of truth** for the pivot from a FinTech Point-of-Sale application to a Scheduling, CRM, Staff Accountability, and Reputation Management engine. Read this file before starting any new phase or when encountering an architectural conflict.

---

## 1. Context & Current State

### What We Currently Have

- A **single-tenant salon booking template** built on TanStack Start (React 19) and Supabase.
- A fully functional **public 4-step booking wizard** that saves to a Postgres database with Row-Level Security (RLS).
- Existing data models for **salons, staff, services, clients, and bookings**.
- A prototype owner dashboard with **Stripe Checkout, Stripe Elements POS terminal, deposit logic, and FinTech-oriented KPIs**.

### What Is Changing (The Pivot)

- The business owner **explicitly rejected digital payments and Stripe**. All payments processed in-store via physical Credit/Debit, Cash, Venmo, Cash App.
- The product pivots away from **FinTech Point-of-Sale** to strictly a **Scheduling platform, CRM, Staff Accountability engine, and Reputation Management tool**.
- **New architecture:** System-automated staff lockout via mandatory post-appointment modal. Automated Twilio 1-5 rating feedback loop. Owner dashboard aggregates in-store payment methods and tips.

---

## 2. High-Level Workstreams

| #     | Workstream                                                 | Description                                                                                                                                                                                         | Depends On |
| ----- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **A** | **Strip Stripe & Deposits**                                | Remove all Stripe SDKs, env vars, types, configs, POS components, deposit logic, checkout sessions, and payment references from codebase                                                            | None       |
| **B** | **Schema Migration**                                       | Drop Stripe/deposit columns; add `payment_method` enum, modal capture columns, rating columns to bookings                                                                                           | None       |
| **C** | **Staff Route Group + Lockout Modal + Twilio Rating Loop** | Build `_authenticated/staff` route group. System-auto-locks staff with forced modal capturing tip, payment method, notes. Twilio 1-5 SMS rating → Google Review link (4-5) or owner alert (1-3).    | B          |
| **D** | **Owner Dashboard Overhaul + Master Calendar**             | Replace FinTech KPIs with payment-method breakdown + total tips. Add alerts panel for low ratings. Build master calendar overlay showing all staff + customers in unified view. Add CRM data table. | A, C       |
| **E** | **Documentation Sweep**                                    | Rewrite all 10 `/docs/` files to remove Stripe/POS/FinTech and reflect Scheduling/CRM/Accountability/Reputation model                                                                               | All        |

---

## 3. Detailed Implementation: Workstream A — Strip Stripe & Deposits

**Goal:** Remove all Stripe SDKs, env vars, types, configurations, POS components, deposit logic, checkout sessions, and all payment references.

### Files to Modify (14)

| #   | File                                                   | Change                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | `src/lib/booking.functions.ts`                         | Remove `stripe` import, `createCheckoutSession`, deposit/depositToggle logic from `createPublicBooking`. Remove `verifyCheckoutSession` entirely. Booking always creates with `confirmed` status. Remove `stripeSessionId` from params & return types. |
| A2  | `src/lib/admin.functions.ts`                           | Remove `completeBookingWithPayment` (POS terminal function). Remove `createPOSPaymentIntent`.                                                                                                                                                          |
| A3  | `src/lib/admin-crud.functions.ts`                      | Check for Stripe references — remove if found (likely none).                                                                                                                                                                                           |
| A4  | `src/lib/config.server.ts`                             | Remove `hasStripe()`, `getStripeSecretKey()`, `getStripePublishableKey()`, `getStripeWebhookSecret()`. Delete all `STRIPE_*` env var reads.                                                                                                            |
| A5  | `src/lib/email.server.ts`                              | Remove Stripe/payment references from email confirmation body.                                                                                                                                                                                         |
| A6  | `src/routes/book.tsx`                                  | Remove `depositToggle`, `depositAmount` input, `checkoutUrl` redirect logic, Stripe-related loading states.                                                                                                                                            |
| A7  | `src/routes/booking-confirmed.tsx`                     | Remove `verifyCheckoutSession` call and Stripe verification. Simplify to just show booking confirmation details.                                                                                                                                       |
| A8  | `src/routes/_authenticated/-admin-pos.tsx`             | **DELETE** entire file.                                                                                                                                                                                                                                |
| A9  | `src/routes/_authenticated/admin.tsx`                  | Remove POS tab import and navigation entry.                                                                                                                                                                                                            |
| A10 | `src/routes/_authenticated/-booking-step-progress.tsx` | Verify 4-step layout is clean (no deposit step).                                                                                                                                                                                                       |
| A11 | `src/lib/salon.ts`                                     | Verify `computeAvailableSlots` has no deposit filtering (should be clean).                                                                                                                                                                             |
| A12 | `src/start.ts` / `src/server.ts`                       | Check for Stripe webhook middleware or route — remove if found.                                                                                                                                                                                        |
| A13 | `package.json`                                         | Remove `@stripe/stripe-js`, `stripe` from dependencies.                                                                                                                                                                                                |
| A14 | `.env.example`                                         | Remove all `STRIPE_*` and `VITE_STRIPE_*` vars.                                                                                                                                                                                                        |

### Files to Keep (unchanged)

- `src/lib/rate-limiter.ts`, `src/lib/error-capture.ts`, `src/lib/salon.ts` (`computeAvailableSlots`), `src/integrations/supabase/` (clients, auth attacher, middleware), `src/router.tsx`, all book/ step components (except step-progress for deposit toggle cleanup), `-admin-calls.tsx`, `-admin-floor.tsx`, `-admin-waitlist.tsx`.

---

## 4. Detailed Implementation: Workstream B — Schema Migration

**Goal:** Drop Stripe/deposit columns, add new columns for staff modal capture and Twilio rating loop.

### Migration: `supabase/migrations/0008_pivot.sql`

```sql
-- Drop Stripe/deposit columns (cleanup)
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_paid;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_session_id;

-- New enum for in-store payment methods
CREATE TYPE payment_method AS ENUM ('Credit/Debit', 'Cash', 'Venmo', 'Cash App');

-- New columns for staff completion modal
ALTER TABLE bookings ADD COLUMN tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN payment_method payment_method;
ALTER TABLE bookings ADD COLUMN service_notes TEXT;
ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN client_rating SMALLINT CHECK (client_rating >= 1 AND client_rating <= 5);
ALTER TABLE bookings ADD COLUMN rating_sent_at TIMESTAMPTZ;  -- tracks when Twilio rating SMS was sent
```

### Booking Creation Logic Change

- **Before:** Booking inserted as `pending_payment`, waited for Stripe Checkout confirmation, then updated to `confirmed`.
- **After:** Booking inserted directly as `confirmed` on submit. No payment step.

### Booking Statuses (unchanged)

`confirmed`, `completed`, `cancelled`, `no_show` — all stay the same. The `completed` status now triggers the staff lockout + forced modal.

---

## 5. Detailed Implementation: Workstream C — Staff Route Group + Lockout Modal + Twilio Rating Loop

### 5.1 The System-Automated Staff Lockout Mechanism

**Core concept:** When a booking status changes to `completed`, the system does NOT immediately finalize it. Instead, it sets `completed_at = NULL` (or just relies on `completed_at IS NULL` as the signal). The assigned staff member is "locked" — they cannot proceed until they submit the forced modal.

**Flow:**

1. Owner (or system) marks booking → status = `completed`
2. Staff logs into their staff dashboard (`/_authenticated/staff/`)
3. Dashboard checks `getPendingCompletions(staffId)` — any bookings where `status = 'completed' AND completed_at IS NULL`
4. If pending completions exist → **full-screen blocking modal overlay** renders
5. Staff cannot dismiss, navigate away, or interact with any other part of the system until modal is submitted
6. Modal submission → `completeStaffModal(bookingId, data)` server fn writes:
   - `service_notes`, `tip_amount`, `payment_method`, `completed_at = NOW()`
7. Modal closes → staff sees their regular dashboard
8. After modal submission → system triggers Twilio rating SMS to client

### 5.2 Route Structure

**New route group:** `src/routes/_authenticated/_staff/`

| Route                 | File                             | Description                                                                                       |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/staff`              | `_staff.tsx`                     | Layout route, auth-gated (staff role check), applies staff layout                                 |
| `/staff/index`        | `_staff/-staff-dashboard.tsx`    | **NEW.** Main staff view. Checks pending completions → renders modal overlay or regular dashboard |
| `/staff/appointments` | `_staff/-staff-appointments.tsx` | **NEW.** Staff's upcoming appointments list                                                       |

### 5.3 Staff Dashboard Logic

```
on mount → call getPendingCompletions(staffId)
  ├── pending exists → FORCED MODAL OVERLAY (cannot close, no back-button)
  │     Fields: Service Provided (dropdown from services list, pre-filled with booking service)
  │             Tip Amount (number input)
  │             Payment Method (radio: Credit/Debit | Cash | Venmo | Cash App)
  │             Notes (textarea, optional)
  │     Submit → writeStaffModal(bookingId, { tip_amount, payment_method, service_notes })
  │            → booking.completed_at = NOW()
  │            → trigger Twilio rating SMS → modal dismissed
  └── no pending → show regular staff dashboard (today's appointments)
```

### 5.4 Twilio 1-5 Rating Loop

**Trigger:** After staff submits the forced modal (booking's `completed_at` is set).

**Files:**

| #   | File                               | Change                                                                                                                                                                                                                                           |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | `src/lib/twilio.server.ts`         | **NEW.** Export `sendRatingSms(phone, bookingId)` — sends "Thanks for visiting! Reply with a number 1-5 to rate your experience." Updates `bookings.rating_sent_at`. Export `handleRatingReply(From, Body, bookingId)` — parses Body as integer. |
| C2  | `src/routes/api/twilio-webhook.ts` | **NEW.** TanStack Start API route (`POST /api/twilio-webhook`). Receives Twilio incoming SMS. Parses `Body` (should be number 1-5). Calls `handleRatingReply()`.                                                                                 |
| C3  | `src/lib/booking.functions.ts`     | Add `completeStaffModal(bookingId, data)` — writes modal fields, sets `completed_at = NOW()`, calls `sendRatingSms()`. Add `getPendingCompletions(staffId)` — returns bookings with `status = 'completed' AND completed_at IS NULL`.             |
| C4  | `src/lib/admin.functions.ts`       | Add `getOwnerAlerts()` — returns recent 1-3 ratings with booking context.                                                                                                                                                                        |

**Twilio webhook routing logic:**

```
Incoming SMS from client:
  Parse Body → rating (1-5)

  IF rating >= 4:
    → Reply SMS: "Thank you! Please leave us a review here: [GOOGLE_REVIEW_URL]"
    → Update booking.client_rating = rating
    → No owner alert needed

  IF rating <= 3:
    → Reply SMS: "We're sorry your experience wasn't perfect. We'll make it right."
    → Update booking.client_rating = rating
    → Push alert: INSERT INTO owner_alerts (booking_id, client_phone, rating, created_at)
    → Owner dashboard shows this in Alerts tab
```

**Environment variables to add:**

- `TWILIO_ACCOUNT_SID` (server-only)
- `TWILIO_AUTH_TOKEN` (server-only)
- `TWILIO_PHONE_NUMBER` (server-only)
- `GOOGLE_REVIEW_URL` (server-only, configurable per salon)

---

## 6. Detailed Implementation: Workstream D — Owner Dashboard Overhaul + Master Calendar

### 6.1 Dashboard KPI Refactor

**Remove:** All FinTech / digital processing KPIs, seed demo data button.

**Replace with:**

| KPI                          | Source                               | Display                                                             |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| **Payment Method Breakdown** | `bookings.payment_method` aggregated | 4-card row or pie chart: Cash, Venmo, Cash App, Credit/Debit totals |
| **Total Tips**               | `SUM(bookings.tip_amount)`           | Dollar amount, with trend                                           |
| **Low Rating Alerts**        | `bookings.client_rating <= 3`        | Alert count + recent entries                                        |
| **Total Bookings**           | `COUNT(bookings.id)`                 | Keep existing                                                       |
| **Today's Appointments**     | bookings for today                   | Keep existing                                                       |
| **Staff Stats**              | per-staff breakdown                  | Keep existing                                                       |

### 6.2 Master Calendar Overlay

**New requirement:** A single unified view showing all 6-7 staff members and their paired customers.

**Design:**

- Grid layout: columns = staff members (up to 7), rows = time slots (15-min or 30-min increments)
- Each cell shows the client name + service booked
- Color-coded by status (confirmed, completed, cancelled, no_show)
- Navigation: today button, prev/next day, week view toggle
- Click on an appointment to see details (client info, service, notes, rating)

### 6.3 Alerts Tab

**New dedicated tab in admin navigation.** Shows:

- Recent low ratings (1-3) with client name, assigned staff, booking date/time
- Owner can mark alerts as "acknowledged" (dismisses from active view, stays in history)

### 6.4 CRM Data Table

In the Alerts or a dedicated view:

- Customer history (past bookings, total spent, visit frequency)
- Staff notes from the forced modal (`service_notes`)
- Rating feedback from Twilio loop

### Files to Modify

| #   | File                                               | Change                                                                                                                                             |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `src/routes/_authenticated/-admin-dashboard.tsx`   | Rewrite KPIs: payment method breakdown, total tips, low rating alerts. Remove seed button + Stripe KPIs.                                           |
| D2  | `src/routes/_authenticated/-admin-calendar.tsx`    | Add **Master Calendar Overlay** — grid view showing all staff columns + time-slot rows showing paired customers. Keep existing day view as option. |
| D3  | `src/routes/_authenticated/-admin-alerts.tsx`      | **NEW.** Low-rating alerts list with acknowledge action. CRM data table (customer history, staff notes, ratings).                                  |
| D4  | `src/routes/_authenticated/admin.tsx`              | Replace POS tab with Alerts tab. Add Master Calendar. Tab order: Dashboard, Calendar, Commissions, Alerts, Staff/Settings, Waitlist, Floor, Calls. |
| D5  | `src/routes/_authenticated/-admin-commissions.tsx` | Verify no Stripe dependency — already a ledger, should be clean.                                                                                   |
| D6  | `src/routes/_authenticated/-admin-waitlist.tsx`    | Already clean — keep.                                                                                                                              |
| D7  | `src/routes/_authenticated/-admin-floor.tsx`       | Already clean — keep.                                                                                                                              |

---

## 7. Detailed Implementation: Workstream E — Documentation Sweep

Rewrite all 10 files in `/docs/` to remove Stripe/POS/FinTech references and reflect new reality.

| #   | File                        | Key Changes                                                                      |
| --- | --------------------------- | -------------------------------------------------------------------------------- |
| E1  | `PIVOT-PLAN.md`             | This file — single source of truth                                               |
| E2  | `AI-BLUEPRINT.md`           | Remove FinTech positioning, add staff accountability + Twilio loop               |
| E3  | `ARCHITECTURE.md`           | Remove PaymentIntent/CheckoutSession flows, update data flow diagram             |
| E4  | `COLD_EMAIL_TEMPLATES.md`   | Remove Stripe/payment value props, reposition as scheduling/CRM                  |
| E5  | `DEPLOYMENT_RUNBOOK.md`     | Remove Stripe webhook setup, add Twilio webhook + env vars                       |
| E6  | `GENERICIZATION_ROADMAP.md` | Remove Stripe template references                                                |
| E7  | `LLM_SALES_CONTEXT.md`      | Full rewrite — scheduling, reputation, accountability engine                     |
| E8  | `onboarding-new-salon.md`   | Remove Stripe/FinTech setup steps                                                |
| E9  | `TECHNICAL_SPEC.md`         | Rewrite booking flow (no checkout), remove Stripe sections, add Twilio + lockout |
| E10 | `TEST-PATTERNS.md`          | Remove Stripe test patterns, add Twilio/rating tests                             |

---

## 8. Execution Plan

### Phase Order

```
Phase 1 (parallel):
  Workstream A — Strip Stripe (code only)
  Workstream B — Schema migration (DB only)

Phase 2 (after B completes):
  Workstream C — Staff routes, lockout modal, Twilio rating loop

Phase 3 (after A + C complete):
  Workstream D — Dashboard overhaul, master calendar, alerts tab

Phase 4 (last):
  Workstream E — Documentation sweep (after all code is final)
```

### Validation Gates

| Gate | When          | Check                                                                        |
| ---- | ------------- | ---------------------------------------------------------------------------- |
| G1   | After Phase 1 | `bun run build` compiles clean, `bun run lint` passes                        |
| G2   | After Phase 2 | Build + lint + manual: staff modal blocks correctly, Twilio webhook responds |
| G3   | After Phase 3 | Build + lint + manual: dashboard KPIs, master calendar, alerts               |
| G4   | Final         | Build + lint + all tests + full manual walkthrough                           |

---

## 9. Key Constraints

| Constraint                            | Detail                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| **No digital payments**               | All payments in-store: Credit/Debit, Cash, Venmo, Cash App only     |
| **No Stripe**                         | Remove all Stripe SDKs, env vars, configs, types, references        |
| **Staff lockout is system-automated** | Hard block until accountability modal is submitted; no admin toggle |
| **Twilio loop is 1-5 rating only**    | No 2-way chat; auto-reply branches on rating threshold              |
| **Demo deadline**                     | Wednesday — production-ready                                        |
| **PIVOT-PLAN.md is source of truth**  | Read before any phase start or architectural decision               |

---

## 10. Definition of Done

- [ ] All Stripe/POS code removed from codebase (A)
- [ ] Migration applied: new columns + enum for payment_method (B)
- [ ] `_authenticated/staff` route group exists with forced modal (C)
- [ ] Staff modal captures tip, payment method, service, notes and persists to DB (C)
- [ ] Twilio webhook configured and handling 1-5 SMS replies (C)
- [ ] 4-5 rating → Google Review link auto-reply (C)
- [ ] 1-3 rating → apology + owner alert (C)
- [ ] Owner dashboard shows payment-method breakdown + total tips (D)
- [ ] Master calendar overlay shows all staff + customers in unified view (D)
- [ ] Alerts tab for low ratings + CRM data table (D)
- [ ] All 10 `/docs/` files purged of Stripe/POS/FinTech references (E)
- [ ] `bun run build` + `bun run lint` + `bun run test` all pass

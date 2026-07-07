# Salon Booking & Management Platform — LLM Sales Context

> **What this is:** A context document for AI assistants, sales reps, and documentation to accurately describe, position, and sell this product. Every claim is grounded in the actual codebase.

---

## Product One-Liner

A full-stack salon management application — booking website, admin dashboard, staff accountability engine, reputation management, commission tracking, and SMS notifications — built on TanStack Start + Supabase, fully genericized and ready to brand for any salon.

---

## What It Does

### For Customers (Public-Facing)

- **Book appointments online** — 4-step wizard: pick a service → choose a staff member → select date/time → confirm
- **Browse services** — catalog by category with prices, durations, and descriptions
- **View gallery** — salon photos
- **Lookup appointments** — by phone number
- **Gift cards** — information page
- **Receive SMS feedback requests** — 1-5 rating after each appointment

### For Salon Owners (Admin Console)

- **Dashboard** — daily/weekly/monthly booking KPIs, payment-method breakdown (Cash, Venmo, Cash App, Credit/Debit), total tips, low-rating alerts
- **Calendar** — daily appointment grid by staff member + master calendar overlay
- **Floor management** — real-time board showing which staff are with clients, available, or offline
- **Commission tracking** — per-staff commission ledger with CSV export
- **Alerts & CRM** — low-rating alerts (1-3) with booking context, customer history, staff notes
- **Waitlist** — manage overflow demand
- **AI call log viewer** — view AI receptionist transcripts
- **Settings** — full CRUD for staff (name, title, bio, commission, hourly rate), services (name, duration, price, category, description), hours editor (per-day open/close), social link configuration

### For Staff (Staff Dashboard)

- **Forced completion modal** — system-enforced lockout until payment method, tip, and service notes are captured
- **Today's appointments** — clean upcoming schedule view

### Automated (Server-Side)

- **Twilio SMS confirmations** — sends booking confirmation messages automatically
- **Twilio 1-5 rating loop** — post-appointment SMS asking for rating; 4-5 → Google Review link, 1-3 → apology + owner alert
- **Rate limiting** — protects public booking endpoint (max 3 per phone per 5 minutes)
- **Race condition prevention** — database exclusion constraint prevents double-booking
- **Staff accountability** — system-enforced lockout modal ensures every booking gets payment and notes captured

---

## Tech Stack

| Category      | Choice                      | Why It Matters                                           |
| ------------- | --------------------------- | -------------------------------------------------------- |
| **Framework** | TanStack Start (React 19)   | SSR + file-based routing, Vercel-native                  |
| **UI**        | Tailwind CSS v4 + shadcn/ui | Modern, customizable, accessible                         |
| **Database**  | Supabase PostgreSQL         | Full RLS, realtime subscriptions, hosted                 |
| **Auth**      | Supabase Auth               | Email magic links, row-level security                    |
| **SMS**       | Twilio                      | Reliable SMS notifications + automated rating collection |
| **Email**     | Resend                      | Transactional booking confirmations                      |
| **Analytics** | Umami Cloud                 | Privacy-first visitor tracking (free tier)               |
| **Hosting**   | Vercel (Nitro serverless)   | Zero-config deploy, global CDN                           |
| **Runtime**   | Bun                         | Fast builds, native TypeScript                           |
| **Testing**   | Vitest                      | Unit test infrastructure                                 |
| **CI/CD**     | GitHub Actions              | Lint, typecheck, build on push/PR                        |

---

## Key Differentiators

### 1. Single Binary — Booking Website + Admin Console + Staff Accountability + CRM

Most salon software is a standalone POS. This app IS the salon's website AND the back-office system. Customers book through the same app the owner uses to manage staff, track commissions, and monitor client satisfaction.

### 2. System-Enforced Staff Accountability

Unlike any competitor, this platform has a **forced staff lockout modal**. When a booking is completed, the assigned staff member cannot use the system until they capture the payment method, tip amount, and service notes. There is no admin toggle to disable this — it is hard-coded, system-automated enforcement.

### 3. Automated Client Feedback Loop

After each appointment, clients receive an SMS asking for a 1-5 rating. High ratings (4-5) get a Google Review link. Low ratings (1-3) trigger an instant owner alert. This closes the feedback loop without manual follow-up.

### 4. Real-Time Everything

Supabase Realtime websockets push state changes instantly. Floor management updates without polling. Booking availability recomputes after every change.

### 5. Production-Ready Security

- **Every DB query filters by SALON_ID** — zero cross-tenant data leak risk
- **Rate limited** public booking endpoint
- **Exclusion constraint** prevents double-booking race conditions
- **Environment-gated integrations** — Twilio and Resend only activate when configured

### 6. Fully Genericized — No Hardcoded Brand

Every text string, URL, and configuration value is driven by environment variables. Deploy for any salon by changing `.env` — no code changes needed.

### 7. In-Store Payment Capture

All payments processed in-store via Credit/Debit, Cash, Venmo, or Cash App. The staff modal captures the payment method and tip, giving owners full visibility into in-store revenue without any PCI scope or digital payment dependency.

### 8. Commission-Ready Architecture

The schema separates commission_records from bookings with per-staff commission_pct and hourly_rate. The admin commissions tab has the richest UI in the app — sortable, paginated, CSV-exportable.

### 9. TanStack Start for SEO

Server-side rendering means Google crawls every page. Booking pages, service pages, and the home page are all SSR with proper meta tags and JSON-LD structured data.

---

## What's Included

### Code

- 30+ route files (public site + admin console + staff dashboard + booking confirmation)
- 7 Supabase migrations (11 tables, 5 enums, RLS, triggers, RPCs, exclusion constraint)
- 12 business logic modules (booking, staff modal, Twilio rating loop, admin CRUD, rate limiting)
- 12 shadcn/ui components
- Twilio SMS integration (booking confirmations + 1-5 rating loop)
- Resend email integration (booking confirmations)
- Umami Cloud analytics (free privacy-first visitor tracking)
- Generic sliding-window rate limiter
- Full admin CRUD for staff, services, and hours
- Forced staff lockout modal (system-enforced)
- Owner alerts for low ratings
- Master calendar overlay
- Seed data for demo

### Design

- Tailwind CSS v4 with configurable color palette
- Responsive layout (mobile + desktop)
- shadcn/ui component library

### Infrastructure

- `vercel.json` deploy config
- Supabase client factory (3-tier auth: anon, service-role, session)
- Server-only env wrapper
- TypeScript strict mode
- `.env.template` with all config options documented
- `.github/workflows/ci.yml` — lint + typecheck + build
- `vitest.config.ts` — test infrastructure
- `.gitignore` protecting secrets

---

## What's NOT Included (White-Label Integration Needed)

| Gap                                | Complexity | Notes                                                                     |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------- |
| **AI receptionist**                | High       | Twilio Voice + LLM (VAPI/Retell) needed. Schema ready, stub viewer exists |
| **Gallery management**             | Low-Medium | Images in source code, not admin-uploadable                               |
| **Staff mobile app**               | High       | Staff clock-in/out, floor management from phone                           |
| **Calendar sync**                  | Medium     | Google Calendar / iCal export                                             |
| **Full test coverage**             | Medium     | 76 unit tests (Zod schemas + env/config). No integration/e2e              |
| **Google Reviews API integration** | Medium     | Currently sends link — API integration for automatic review posting       |

---

## Ideal Buyer Profiles

### 1. Developer Agency Building for Salon Chains

- Wants a white-label product to deploy for multiple salons
- Needs a solid foundation with multi-tenant schema
- Full genericization saves days of brand-scrubbing work

### 2. Salon Chain Owner with Technical Resources

- Has 3+ locations, wants a unified booking + management system
- Needs custom branding per location
- Can hire a developer for deployment and minor customization

### 3. Nail Salon Software Startup

- Building a vertical SaaS for nail salons specifically
- Needs to launch fast with a proven UX pattern
- Uses this as the MVP foundation

### 4. Independent Developer / Consultant

- Wants to offer salon management as a service
- Needs a codebase that's clean, modern, and extensible
- Can sell "website + booking + staff accountability + CRM" as a package

---

## Competitive Positioning

| Against                            | This Product Advantage                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Booksy**                         | You OWN the code. No per-booking fees. White-label. Staff accountability enforcement + automated reputation management |
| **Square Appointments**            | Dedicated salon features (commission, floor board, staff modal). SSR website built in. Automated client feedback loop  |
| **Vagaro**                         | Modern tech stack (React 19, Supabase). No legacy monolith. System-enforced staff accountability                       |
| **Custom WordPress + WooCommerce** | Real-time floor management, staff lockout modal, commission tracking, automated rating collection built in             |
| **Building from scratch**          | 30+ routes, 11 tables, 12 lib modules — 90%+ of the work done                                                          |

---

## Code Quality Signals

| Signal                                   | Status              |
| ---------------------------------------- | ------------------- |
| TypeScript strict mode                   | ✅                  |
| React 19                                 | ✅                  |
| TanStack Router (typesafe routing)       | ✅                  |
| Zod validation                           | ✅                  |
| Supabase RLS on all tables               | ✅                  |
| Error boundaries                         | ✅                  |
| SSR + SEO meta tags                      | ✅                  |
| ARIA labels (booking wizard)             | ✅                  |
| Responsive design                        | ✅                  |
| Component library (shadcn/ui)            | ✅                  |
| .gitignore protecting secrets            | ✅                  |
| .env.template documented                 | ✅                  |
| Rate limiting                            | ✅                  |
| CI/CD pipeline                           | ✅                  |
| Test infrastructure                      | ✅                  |
| Staff lockout modal (system-enforced)    | ✅                  |
| Twilio integration (SMS + rating loop)   | ✅                  |
| Email integration (Resend)               | ✅                  |
| Owner alerts (low ratings)               | ✅                  |
| Master calendar overlay                  | ✅                  |
| Analytics (Umami)                        | ✅                  |
| Admin CRUD (staff/services/hours)        | ✅                  |
| Exclusion constraint (no double-booking) | ✅                  |
| Tests                                    | ⚠️ Minimal coverage |
| Gallery management                       | ❌ Not yet          |
| AI receptionist                          | ❌ Not yet          |

---

## Estimated Time to Production

| Scenario                   | Timeline   | Work Required                                  |
| -------------------------- | ---------- | ---------------------------------------------- |
| **Single salon, branded**  | 1-2 weeks  | Deploy + configure env + seed staff/services   |
| **Multi-salon deployment** | 3-6 weeks  | Multi-tenancy dev ops                          |
| **Full SaaS platform**     | 3-6 months | Multi-salon admin, staff mobile app, analytics |
| **AI receptionist added**  | +2-4 weeks | Twilio + VAPI/Retell integration               |

---

## Common Objections & Responses

**"Why not just use Booksy?"**
Booksy charges per-transaction fees. You don't own the customer relationship. This gives you a white-label product you can deploy for $0/marginal cost per salon, with built-in staff accountability enforcement and automated reputation management.

**"Is it production-ready?"**
Yes. All critical security gaps (data isolation, rate limiting, double-booking, secrets exposure) are resolved. The staff modal enforces accountability. Twilio handles SMS + ratings. The admin panel has full staff/service/hours management. The remaining gaps (gallery, AI, email) are additions, not blockers.

**"How hard is the genericization?"**
Already done. The template is fully genericized — zero hardcoded brand values. Changing salon name, address, phone, social links, colors — all env vars. A 5-minute `.env` edit is all it takes.

**"What about mobile?"**
The public site is responsive. The admin console works on tablets. No native mobile app — staff floor management would need a mobile app or PWA.

---

## Pricing Guidance

This is sold as source code (not SaaS):

- **Single-use license** (one salon deployment): $1,500-$3,000
- **Developer license** (unlimited deployments for one dev shop): $5,000-$7,000
- **White-label SaaS license** (deploy for N salons): $10,000-$15,000
- **Integration + deployment services**: $5,000-$15,000 per engagement

Value justification: ~500+ hours of development time saved. A comparable custom build: $30k-$60k from an agency.

---

## Technical Spec Reference

For complete technical details, see [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md).
For the deployment runbook, see [`onboarding-new-salon.md`](./onboarding-new-salon.md).

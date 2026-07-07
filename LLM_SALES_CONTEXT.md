# Nail Salon Booking + POS — LLM Sales Context

> **What this is:** A context document for AI assistants, sales reps, and documentation to accurately describe, position, and sell this product. Every claim is grounded in the actual codebase.

---

## Product One-Liner

A full-stack nail salon management application — booking website, admin dashboard, POS terminal, and commission tracking — built on TanStack Start + Supabase, ready to be branded for any salon.

---

## What It Does

### For Customers (Public-Facing)
- **Book appointments online** — 4-step wizard: pick a service → choose a staff member → select date/time → confirm
- **Browse services** — catalog by category with prices and durations
- **View gallery** — salon photos
- **Lookup appointments** — by phone number
- **Gift cards** — information page

### For Salon Owners (Admin Console)
- **Dashboard** — daily/weekly/monthly revenue KPIs, booking counts, charts
- **Calendar** — daily appointment grid by staff member
- **Floor management** — real-time board showing which staff are with clients, available, or offline
- **POS terminal** — walk-in checkout flow
- **Commission tracking** — per-staff commission ledger with CSV export
- **Waitlist** — manage overflow demand
- **AI call log viewer** — view AI receptionist transcripts
- **Settings** — edit salon name, address, phone

---

## Tech Stack

| Category | Choice | Why It Matters |
|----------|--------|----------------|
| **Framework** | TanStack Start (React 19) | SSR + file-based routing, Vercel-native |
| **UI** | Tailwind CSS v4 + shadcn/ui | Modern, customizable, accessible |
| **Database** | Supabase PostgreSQL | Full RLS, realtime subscriptions, hosted |
| **Auth** | Supabase Auth | Email magic links, row-level security |
| **Hosting** | Vercel (Nitro serverless) | Zero-config deploy, global CDN |
| **Runtime** | Bun | Fast builds, native TypeScript |

---

## Key Differentiators

### 1. Single Binary — Booking Website + Admin Console + POS
Most salon software is a standalone POS. This app IS the salon's website AND the back-office system. Customers book through the same app the owner uses to manage the floor.

### 2. Real-Time Floor Management
Supabase Realtime websockets push state changes instantly. When a staff member marks themselves "with client" at the front desk, the admin console updates in real time without polling or page refresh.

### 3. Commission-Ready Architecture
The schema separates commission_records from bookings with per-staff commission_pct and hourly_rate. The admin commissions tab has the richest UI in the app — sortable, paginated, CSV-exportable.

### 4. RLS-First Multi-Tenant Schema
Every table has a `salon_id` foreign key. Row-level security checks `is_salon_member()` on every query. The schema is ready for multi-tenancy — the application code just needs the plumbing.

### 5. AI Receptionist Ready
The `ai_calls` table and call log viewer are stubs waiting for Twilio Voice + LLM integration. The data model stores transcripts, summaries, intents, and booking links.

### 6. TanStack Start for SEO
Server-side rendering means Google crawls every page. Booking pages, service pages, and the home page are all SSR with proper meta tags and JSON-LD structured data.

---

## What's Included

### Code
- 29 route files (public site + admin console)
- 5 Supabase migrations (10 tables, 4 enums, RLS, triggers, RPCs)
- 7 business logic modules
- 12 shadcn/ui components
- Seed data for demo

### Design
- Tailwind CSS v4 with salmon/pink brand palette
- Responsive layout (mobile + desktop)
- shadcn/ui component library

### Infrastructure
- `vercel.json` deploy config
- Supabase client factory (3-tier auth: anon, service-role, session)
- Server-only env wrapper
- TypeScript strict mode

---

## What's NOT Included (White-Label Integration Needed)

These are the integration gaps that a buyer must fill to go to production:

| Gap | Complexity | Notes |
|-----|-----------|-------|
| **Payment processing** | Medium-High | No Stripe SDK installed. POS is mock setTimeout. Need Stripe Elements + webhooks |
| **SMS/Email notifications** | Medium | No Twilio/SendGrid. Booking confirmations don't exist |
| **AI receptionist** | High | Twilio Voice + LLM (VAPI/Retell) needed. Schema ready, code stub |
| **Multi-tenancy** | Medium | Schema has salon_id, but code hardcodes Nail Lounge everywhere |
| **Admin CRUD** | Low-Medium | No UI to add/edit staff, services, or gallery images |
| **Staff app** | High | Staff clock-in/out, floor status self-management via mobile |
| **Calendar sync** | Medium | Google Calendar / iCal export |
| **Analytics** | Low | No Google Analytics or Plausible |
| **Testing** | Medium | Zero test coverage — any framework needs setup |

---

## Ideal Buyer Profiles

### 1. Developer Agency Building for Salon Chains
- Wants a white-label product to deploy for multiple salons
- Needs a solid foundation with multi-tenant schema
- Will fill payment/Twilio integrations once per template

### 2. Salon Chain Owner with Technical Resources
- Has 3+ locations, wants a unified booking + management system
- Needs custom branding per location
- Can hire a developer for the integration work

### 3. Nail Salon Software Startup
- Building a vertical SaaS for nail salons specifically
- Needs to launch fast with a proven UX pattern
- Uses this as the MVP foundation

### 4. Independent Developer / Consultant
- Wants to offer salon management as a service
- Needs a codebase that's clean, modern, and extensible
- Can sell "website + booking + POS" as a package

---

## Competitive Positioning

| Against | This Product Advantage |
|---------|----------------------|
| **Booksy** | You OWN the code. No per-booking fees. White-label |
| **Square Appointments** | Dedicated nail salon features (commission, floor board). SSR website built in |
| **Vagaro** | Modern tech stack (React 19, Supabase). No legacy monolith |
| **Custom WordPress + WooCommerce** | Real-time floor management, POS, commission tracking built in |
| **Building from scratch** | 29 routes, 10 tables, 7 lib modules — 80%+ of the work done |

---

## Code Quality Signals

| Signal | Status |
|--------|--------|
| TypeScript strict mode | ✅ |
| React 19 | ✅ |
| TanStack Router (typesafe routing) | ✅ |
| Zod validation | ✅ |
| Supabase RLS on all tables | ✅ |
| Error boundaries | ✅ |
| SSR + SEO meta tags | ✅ |
| ARIA labels (booking wizard) | ✅ |
| Responsive design | ✅ |
| Component library (shadcn/ui) | ✅ |
| .gitignore (partially) | ⚠️ .env not gitignored |
| Tests | ❌ None |
| CI/CD | ❌ None |
| Rate limiting | ❌ None |
| .env.template | ❌ Missing |

---

## Estimated Time to Production

| Scenario | Timeline | Work Required |
|----------|----------|---------------|
| **Single salon, branded** | 2-4 weeks | Genericize code + Stripe + Twilio + deploy |
| **Multi-salon deployment** | 4-8 weeks | Multi-tenancy dev ops + Stripe Connect |
| **Full SaaS platform** | 3-6 months | Multi-salon admin, staff mobile app, analytics |
| **AI receptionist added** | +2-4 weeks | Twilio + VAPI/Retell integration |

---

## Common Objections & Responses

**"Why not just use Booksy?"**
Booksy charges per-transaction fees. You don't own the customer relationship. This gives you a white-label product you can deploy for $0/marginal cost per salon.

**"Is it production-ready?"**
The customer-facing flow (booking) is near-production. The admin dashboard is 60% there. Payment and notifications are the gaps — but the architecture is designed for them.

**"How hard is the genericization?"**
56 hardcoded references to "Nail Lounge" across ~25 files. A skilled developer can replace them in a day. The harder work is the admin-configurable settings (staff CRUD, service CRUD, gallery management).

**"What about mobile?""
The public site is responsive. The admin console works on tablets. No native mobile app — staff floor management would need a mobile app or PWA.

---

## Pricing Guidance

This is sold as source code (not SaaS):

- **Single-use license** (one salon deployment): $1,500-$3,000
- **Developer license** (unlimited deployments for one dev shop): $5,000-$7,000
- **White-label SaaS license** (deploy for N salons): $10,000-$15,000
- **Integration + deployment services**: $5,000-$15,000 per engagement

Value justification: ~400+ hours of development time saved. A comparable custom build: $30k-$60k from an agency.

---

## Technical Spec Reference

For complete technical details, see [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md).

For the step-by-step genericization plan, see [`GENERICIZATION_ROADMAP.md`](./GENERICIZATION_ROADMAP.md).

# nail-lounge-mp

> Last updated: 2026-07-07 (3:30 PM CST)

Single-tenant salon booking + CRM platform built with **TanStack Start + Supabase**. One deployment = one salon (`VITE_SALON_ID`), zero hardcoded branding — every salon-specific value comes from env helpers.

**What's inside:** public booking flow (service → artist → time → confirm), phone-based appointment lookup, admin console (dashboard, multi-staff calendar, payroll ledger, low-rating alerts, waitlist, settings CRUD), staff portal with a forced completion-modal lockout (tip / payment method / notes), and an automated Twilio 1–5 rating loop. All payments are collected in-store — no digital payment processing.

## Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Runtime    | Bun (never npm/yarn for local dev)                |
| Framework  | TanStack Start (React 19) + Vite 7                |
| Routing    | TanStack Router (file-based, `src/routes/`)       |
| Data       | TanStack Query v5                                 |
| UI         | Tailwind CSS v4 + shadcn/ui (new-york)            |
| Backend    | Supabase (Postgres, Auth, RLS, RPCs)              |
| SMS        | Twilio (confirmations + rating loop, optional)    |
| Email      | Resend (booking confirmations, optional)          |
| Testing    | Vitest (82 tests)                                 |
| CI/CD      | GitHub Actions → Vercel (Production on `main`)    |

## Quick start

```bash
bun install
cp .env.template .env   # fill in your Supabase project + salon values
bun dev                 # http://localhost:3000
```

`.env.template` is the single source of truth for every environment variable (required vs optional is documented inline).

## Commands

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `bun dev`           | Development server                         |
| `bun run build`     | Production build (Nitro, Vercel preset)    |
| `bun run lint`      | ESLint — zero-warnings gate                |
| `bun run typecheck` | `tsc --noEmit`                             |
| `bun run test`      | Vitest run                                 |
| `bun run format`    | Prettier write                             |

CI runs lint → typecheck → test → build on every push/PR to `main`. All four must pass locally before you push (the pre-push hook enforces build + typecheck and a secret scan).

## Project structure

```
src/
  routes/          # File-based routes (admin sub-views use the -prefix convention)
  lib/             # Business logic + server functions (createServerFn) + tests
  components/      # UI (shadcn/ui + custom)
  integrations/    # Supabase clients + generated types
supabase/
  migrations/      # Apply ALL in timestamp order (see docs/DEPLOYMENT_RUNBOOK.md)
docs/              # Architecture, spec, runbook, onboarding, test patterns
```

**Generated files — never hand-edit:** `src/routeTree.gen.ts` (TanStack Router) and `src/integrations/supabase/types.ts` (Supabase CLI).

## Deployment

Vercel Production deploys automatically on push to `main`. Note: **Vercel builds with npm** (`package-lock.json` takes install priority over `bun.lock`), so both lockfiles must stay in sync — see [CONTRIBUTING.md](./CONTRIBUTING.md). Full per-salon deployment steps: [`docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md) and [`docs/onboarding-new-salon.md`](./docs/onboarding-new-salon.md).

## Key documents

- [`AGENTS.md`](./AGENTS.md) — AI-friendly project overview (routes, key files, conventions)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — architecture + ADRs
- [`docs/TECHNICAL_SPEC.md`](./docs/TECHNICAL_SPEC.md) — full technical specification
- [`docs/TEST-PATTERNS.md`](./docs/TEST-PATTERNS.md) — testing conventions
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — code standards + verification checklist
- [`CHANGELOG.md`](./CHANGELOG.md) — notable changes

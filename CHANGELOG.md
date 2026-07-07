# Changelog

> Last updated: 2026-07-07 (3:30 PM CST)

## 2026-07-07 — Tech-debt remediation sweep

### Compliance & security

- **De-gated the Twilio review flow** — every rating (1–5) now receives the same Google-review invitation; low ratings (1–3) still trigger the apology SMS + owner alert. Review-gating violates Google review policies and the FTC rule on consumer reviews (16 CFR Part 465).
- Review link is only appended when `GOOGLE_REVIEW_URL` is set (both branches previously could send a dangling link).
- Removed `.env.example` (shipped a real Supabase project URL; covered 5 of 29 vars) — `.env.template` is the single canonical env reference.
- New `scripts/check-secrets.sh` pre-push secret scan (Supabase/Twilio/Resend/Stripe live-key shapes), wired into `.husky/pre-push`.

### Quality gates

- ESLint: **0 errors, 0 warnings** across the codebase (was 15 warnings) — all `no-explicit-any`, `react-hooks/exhaustive-deps`, and `react-refresh/only-export-components` findings fixed properly (no `eslint-disable`).
- `@typescript-eslint/no-explicit-any` hardened `warn` → `error`; `lint` script now runs with `--max-warnings 0`.
- New `typecheck` script (`tsc --noEmit`).
- CI workflow update prepared (checkout@v5, typecheck + test steps, dedup install) — applied separately (workflow files require elevated token scope).

### Type safety & tests

- Zod input schemas are now **exported from source** (`booking.functions.ts`, `admin-crud.functions.ts`) and **imported by all test files** — tests validate the real schemas, not inline replicas.
- Removed the `as unknown as` double-cast in the staff dashboard; typed `lookupAppointments` return; typed commission/CRM/staff row shapes; new `asBusinessHours()` narrows the JSON hours columns.
- Fixed a null-date crash path in the payroll ledger that an `any` was masking.

### Docs

- New `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.
- `DEPLOYMENT_RUNBOOK.md` migration list corrected (was 6 nonexistent filenames → the real 11).
- `TECHNICAL_SPEC.md`: fixed fictional migration tree, stale staff-dashboard path, stale versions, and the email-notifications known-issue wording.
- `TEST-PATTERNS.md` updated for schema imports + CI test execution; `AGENTS.md` test count and commands refreshed.
- `top-5-priority-fixes.md` and `remaining-fixes.md` annotated with verified implementation status (all top-5 fixes are DONE — do not re-implement).

## 2026-07-06 — Strategic pivot

Removed all Stripe/deposit/POS payment processing; replaced with in-store payment capture, the staff completion-modal lockout, and the Twilio 1–5 rating loop. Full log: [`CHANGES-6-7-26.MD`](./CHANGES-6-7-26.MD).

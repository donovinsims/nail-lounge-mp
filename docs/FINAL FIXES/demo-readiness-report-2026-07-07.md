# Nail Lounge — Demo Readiness Report, 2026-07-07

## Verdict

Generated 2026-07-07, 7:20 PM CST · Repo donovinsims/nail-lounge-mp @ main a05a644 · Live nails815.vercel.app

## 🔴 Not ready for a click-anywhere demo — but one ~2-minute fix moves it to "yes, with a scripted path."

The app **looks** demo-ready (clean UI, correct hours in-browser, solid auth gating, green build) but the **single most important flow — booking an appointment — is dead in production**: every date, every artist shows _"No availability this day."_ For a booking product, that's the one thing you cannot let an audience click into blind.

The good news: it's **not a code bug** and needs **no redeploy**. The deployed database is running a stale/broken version of one function. Re-apply one migration to prod and the flow comes back. Do that, avoid three specific landmines (below), and follow the safe-path script, and you can give a confident, thorough demo.

**If you fix nothing tonight:** demo the homepage + services + the _start_ of booking only, and never advance to the time-picker on stage. Workable, but you'd be hiding your core feature.

**Bottom line:** Fix the booking RPC (P0-1) + don't touch the landmines → **yes, with caveats.** Leave the RPC broken → **no** for a full demo.

## ⚠️ CI Status (read this)

You asked me to surface CI status prominently, so it's here, not buried.

**CI is green — but it's guarding almost nothing, and the docs overstate it.**

- GitHub Actions **is** running and the latest run (#35 on a05a644) is ✅ **green**. So the earlier worry that the workflow was never pushed is _resolved_ — it exists and runs.
- **But the committed `ci.yml` only runs `lint` + `build`.** There is **no typecheck step and no test step.** The job is even _named_ `lint-and-typecheck`, which is misleading. It uses `actions/checkout@v4`.
- `README.md:45` claims _"CI runs lint → typecheck → test → build"_ and lists _"Vitest (82 tests)"_ under CI/CD. `CHANGELOG.md` admits the upgrade was _"prepared … applied separately"_ — i.e. **never actually committed** (the token lacked workflow scope). **Those claims are false against the live workflow.**
- **Consequence:** the 82 tests and `tsc` have **never run in CI.** A green badge is giving you false confidence.

**Mitigation already done tonight:** I ran the full gate **locally** on the npm/Vercel dependency tree — `lint` ✅, `typecheck` ✅, `test` **82/82** ✅, `build` ✅ (33.6s). So the code itself is clean and builds. Severity is **P1, not P0** (it won't break the demo), but it's the reason none of the prod-DB drift below was ever caught by automation.

## P0 Punch List (fix tonight)

### P0-1 · Booking flow shows zero availability on every date — **the demo-killer**

Walking service → artist → date on the live site lands on _"No availability this day. Try another date."_ for every date and every technician.

![Live booking flow — No availability this day](https://hyperagent.com/api/files/usergenerated/threads/cmrbalqyv020607adbtjf0d3f/images/77c7d910-428b-450d-a8d1-3d7d7e3966ca.jpg)

- **Root cause:** the client calls the `get_available_slots` RPC (`salon.ts:86`); in prod it returns **HTTP 400, code 42703, "column end_time does not exist."** The client catches the error and returns `[]`, so the UI silently shows no slots.
- **Verified:** on-screen on two dates (7/8 and 7/11) + direct anon `curl` to the RPC with the exact client params.
- **Nuance:** prod `bookings` **does** have `end_time`, and the repo's migration `20260707000002_available_slots_rpc.sql` references it correctly — so the **deployed function body is stale/wrong vs the repo**, not the schema.
- **✅ Fix (~2 min, no code deploy):** re-apply `supabase/migrations/20260707000002_available_slots_rpc.sql` (it's `CREATE OR REPLACE FUNCTION`) against the prod database `ecqztajukteergupvrkg`. Then re-test one date in the browser before the demo.

### P0-2 · Anon can read the entire `bookings` table, including PII

- Anon `curl` `GET /rest/v1/bookings?select=...` returns **HTTP 200** and would expose `notes`, `service_notes`, `tip_amount`, `payment_method`, `client_rating`. It's empty right now — which means **the first booking you create during the demo becomes world-readable.**
- **Cause:** prod RLS drift — the hardening migration that drops the public bookings policy only partially applied.
- **✅ Fix tonight:** apply the bookings-policy lockdown migration to prod (revoke anon SELECT / restrict to the intended slot-only RPC path). Directly compounds P0-1 since both trace to the same un-applied migration set.

### Conditional P0 · Do NOT re-run `seed-demo.mjs` as-is

- It inserts `deposit_paid`, a column the pivot migration dropped, so **every booking insert fails** → you'd wipe yourself to 0 bookings. If you want seed data, remove that field first (see Open Questions).

## P1 / P2 / P3 (condensed)

Full detail + evidence for all 24 findings is in the companion file: **`nail-lounge-demo-readiness-findings-2026-07-07.md`** (structured list format — one entry per finding with Severity, Subagent, Area, Finding, Evidence, and Mode Used — designed for reliable parsing by an AI agent, not a markdown table).

**P1 — real, fix if time (several are demo-behavior landmines):**

- **LANDMINE — don't demo Settings → Hours "Save."** The editor reads a different hours format than prod stores, so it opens blank; saving writes the wrong format and **turns the public homepage hours to "Closed" for all 7 days.** Editing hours live would break the one thing that currently looks right.
- **Admin data is empty on prod** (0 bookings/clients/commissions/waitlist/floor) — seed script refuses prod. Views render fine but blank; demo as "fresh install" or seed first.
- **Staff portal isn't demoable live** — no usable staff login (provisioned user is an _owner_, and owners get redirected out of /staff; login is magic-link/Google only, so the committed password can't be used). The staff **lockout modal also has no nav guard** (bypassable via nav/refresh) — safe, but weaker than the docs claim.
- **Dual-lockfile drift** — 47/72 deps differ between `package-lock.json` (Vercel) and `bun.lock` (CI); prod ships a tree CI never tested.
- **Two Supabase projects** — scripts target `wjyj…`, prod is `ecqzt…`; provisioning/seeding hit the wrong DB unedited.
- **Committed admin password** `Hononegah1!` (owner) in `provision-demo-user.mjs` — rotate (P0 if the repo is public).
- **Confirmation SMS won't fire** for normal US phone input (needs `+`/E.164) though the confirmed page says to expect a text — moot until booking is fixed.

**P2 — real, not demo-blocking:**

- **Hours "all Closed" is only a pre-hydration SSR flash** — in a real browser they render correctly (see below). Crawlers/no-JS see Closed. Fix = SSR-prefetch the salon query.
- **Booksy link is `href=""`** (unset env) in the hours card + footer → clicking reloads the page. Don't click it on stage.
- **Today's commit `0adf3e5` is the least-tested code** (booking-confirmed rewrite, Mark-Paid toggle, 240-line CRM table) — type-clean, untested.
- Owner "Donovin" shows as a **public bookable artist**; stale `get_busy_slots` doc reference; admin mobile nav may show only 4/8 tabs.

**P3 — cosmetic / deferred:** duplicate TikTok link in gallery; `privacy.tsx` raw env; 0ms "debounce"; Floor view lacks an empty state; Phase-4 decompositions, integration tests, vitest-eslint, and Sentry still open (refactors/coverage, no user-facing impact).

## Safe-Path Demo Script

Designed to showcase strengths and route around every known landmine.

**Pre-flight (tonight):**

1. Re-apply the slots migration to prod (P0-1) and confirm one date shows times in the browser.
2. Apply the bookings RLS lockdown (P0-2).
3. **Confirm your admin login actually works on prod `ecqzt`** (magic link or Google) — do a dry run.
4. Decide seed-vs-fresh for admin data (see Open Questions).

**On stage — walk this order:**

1. **Homepage** (desktop or mobile — both verified). Hero, featured services, artist cards, hours (correct, 09:30–19:00), map.
2. **Services** page — full menu, 83 real services with prices.
3. **Booking flow** — service → artist → date → **pick a time → land on the confirmation screen.** _Only do this if P0-1 is fixed._ Stop at the confirm screen, or submit exactly one clearly-labeled test booking (note: until P0-2 is fixed, that booking is anon-readable).
4. **Admin** — log in (pre-verified), show the dashboard / multi-staff calendar / payroll ledger / low-rating alerts UI. Narrate empty data as "fresh install." Gating is genuinely solid, so this is safe.

**Do NOT click live:**

- ❌ The **time-picker step** in /book — _if you did not fix P0-1_ (it shows "No availability").
- ❌ **Settings → Hours → Save** — corrupts the public hours to all-Closed.
- ❌ The **Booksy** button anywhere — empty link, reloads the page.
- ❌ **Staff portal login** — no working staff credential.
- ❌ Re-running **seed-demo.mjs** — fails on a dropped column.

**Hours render correctly in a real browser (the "Closed" you saw was the SSR flash):**
![Homepage hours render correctly in-browser](https://hyperagent.com/api/files/usergenerated/threads/cmrbalqyv020607adbtjf0d3f/images/6de7c50e-76a0-40b4-9a1a-ade94cdbaff0.jpg)

## Delta Since Last Audit

Reconciled against `AUDIT-REPORT.md`, `TECH-DEBT-IMPLEMENTATION-PLAN.md`, `remaining-fixes.md`, `top-5-priority-fixes.md` (Subagent F, verified in code).

**No regressions.** Every item those docs marked "fixed" is still fixed on `main`, and `tsc` is clean. Several items moved _ahead_ of their doc status (BottomSheet dead-code → now used in 3 admin views; featured services hardcoded → DB-driven).

- **AUDIT-REPORT criticals** (`/booking-confirmed` + `/staff` meta, hardcoded Supabase URL): all **FIXED**.
- **top-5 mobile fixes**: all 5 independently **re-verified FIXED**.
- **remaining-fixes H1–H5** (loading states, stale-slot clearing, selection feedback, disabled-button reasons, auto-advance removed): all **FIXED**; leftovers are P3 polish (M2/M5/M8).
- **Still open (low risk):** Phase 4 decompositions, Phase 3.2 integration tests, 3.3 vitest-eslint, Sentry — confirmed not started, but they're refactors/coverage, not defects.

**The theme of this delta:** the **code got better; the deployed database and CI/config did not keep pace.** Every P0/P1 that matters tomorrow is **prod-DB drift or deployment/config** (booking RPC, RLS, empty seed data, lockfile drift, under-gated CI) — not application logic. That's why a green local build coexists with a broken live booking flow.

## Open Questions for Donovin

1. **Can you run SQL against prod `ecqzt` tonight?** The two P0s (booking RPC, bookings RLS) are both "re-apply a migration" fixes — trivial if you have SQL access, blocking if you don't.
2. **Is Twilio meant to be live for this demo?** SMS degrades gracefully if not, but it also won't fire for normal phone input even if configured (the `+`/E.164 gap). Decide whether to mention SMS at all.
3. **Is the repo public or private?** Determines whether the committed owner password `Hononegah1!` is a P0 (public) or P1 (private) — rotate either way.
4. **Admin data: seed or fresh?** Want me to hand you a corrected `seed-demo.mjs` (deposit_paid removed, project guard pointed at `ecqzt`) so the dashboard/calendar/commissions show realistic data — or demo as a fresh install with empty states?
5. **Have you actually logged into `/admin` on the live `ecqzt` deployment recently?** Please dry-run it before the demo — the provisioning scripts target the _other_ project, so I couldn't confirm the auth user exists on prod (the owner _staff row_ does).

## Capability Disclosure

So you can calibrate confidence in every claim above:

- **Customer journey (Subagent A):** REAL interactive browser testing — hosted Chromium, actual navigation, clicks, form steps, extraction, and screenshots, at **both desktop and a 390px mobile viewport.** The booking-flow P0 and the hours result are from live clicking, not inference.
- **Backend / security / data (Subagent E) & booking RPC:** verified by **direct anon REST `curl` against the live prod Supabase** (`ecqzt`), using the public anon key from the deployed bundle, plus code-trace of the cloned repo. Row counts, the PII exposure, and the RPC 400 are real HTTP responses.
- **Verification gate (Subagent D):** **EXECUTED locally** on the npm/Vercel dependency tree (after network access was granted) — lint/typecheck/test/build all really ran (82/82, exit 0). The bun/CI tree was compared **statically** (bun couldn't be installed here).
- **Staff & admin internal screens (Subagents B, C):** **code-trace + unauthenticated HTTP probes**, NOT live logins — no working demo credential surfaced and logging in wasn't safe to guess. Auth _gating_ was confirmed empirically (unauthenticated `/admin` + `/staff` leak no data in SSR HTML); everything _behind_ the login is reasoned from code.
- **Console logs:** the browser tooling here does **not** expose a JS console/error stream directly. I used **HTTP status probes** (route/RPC/asset responses) as the failed-request proxy — which is exactly how the booking break was caught (RPC 400 + on-screen empty state) rather than via a console trace. Treat "no console errors" as _not independently verified_; failed _requests_ were verified via status codes.
- **Scope:** strictly read-only on the repo (no commits/pushes/PRs). One accidental prod write-probe by a subagent was a false-positive and confirmed **no** production data was modified.

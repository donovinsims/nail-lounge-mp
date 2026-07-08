# July 7 2026 — CI Fix + PIVOT-PLAN Gaps + Vercel Deployment Fix

## Summary

Three work streams across this day:

1. **CI pipeline**: 4 commits to unbreak, lint quality-gate, and stabilize GitHub Actions (CI run #18 green).
2. **PIVOT-PLAN gaps**: Seed button removal, CRM data table in admin alerts, deposit doc cleanup.
3. **Vercel deployment**: Multiple iterations to get `npm install` succeeding on Vercel build env.

---

## Pre-Phase: CI Unblock (`d78af41`)

- **Investigated** last 15 GitHub commits → 3 failure modes identified
  - (1) Frozen lockfile out of sync
  - (2) Prettier formatting errors in 4 files
  - (3) SSR build RateLimiter export (stale-cache ghost)
- **Cross-referenced** failures with TECH-DEBT-IMPLEMENTATION-PLAN.md
- **Oracle review**: recommended build verification first, pin bun version, batch Phase 1.4 with Phase 2.2
- **Fix applied**:
  - `bun run format` fixed 7 prettier errors
  - `env.test.ts` — added `process.env` fallback matching `isSeedAllowed` pattern
  - Verified: 82/82 tests pass, SSR build clean, tsc clean

## Phase 1: CI Quality Gates (`280803a`)

- **CI config** (`.github/workflows/ci.yml`):
  - Pinned `bun-version: 1.3.x`
  - Added test job
  - Added env block (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SALON_ID`, `VITE_SALON_NAME`)
  - Added `--ignore-scripts` flag on `bun install --frozen-lockfile`
- **Husky**:
  - `pre-commit`: runs `bun run format && bun x lint-staged`
  - `pre-push`: runs `bun run build && bun x tsc --noEmit && bun install --frozen-lockfile --ignore-scripts`
- **lint-staged** + prepare script added to `package.json`

## Phase 2 + 1.4: Type Safety + Error Handler (`280803a`)

### B1 — Catch blocks (4 admin views)

- 10 `catch(e: any)` → `catch(e: unknown)` + `getErrorMessage(e)`
- Files: `-admin-settings.tsx`, `-admin-alerts.tsx`, `-admin-commissions.tsx`, `-admin-floor.tsx`

### B2 — Type annotations (8 files)

- 21 `any` → proper Supabase table types
- 2 `as any` removed
- Files: `-admin-dashboard.tsx`, `-admin-alerts.tsx`, `-admin-calls.tsx`, `-admin-floor.tsx`, `-admin-settings.tsx`, `-admin-waitlist.tsx`, `-admin-commissions.tsx`, `-admin-calendar.tsx`

### New file

- `src/lib/error-handler.ts` — `getErrorMessage(error, fallback?)` utility

### Fixes

- Removed 5 overly-wide explicit type annotations on map/filter callbacks
- Added `start_time` to `weekBookings` select query
- Post-fix: 0 tsc errors, 82/82 tests, build passes

## Phase 2.2a: Husky Pre-push Fix (`280803a`)

- **Problem**: Husky `prepare` script failed in CI and pre-push hook because `git` wasn't in PATH during `husky` install (Bun's git detection issue)
- **Fix**: Added `--ignore-scripts` to all `bun install --frozen-lockfile` calls in:
  - `.github/workflows/ci.yml` (lines 27 and 40)
  - `.husky/pre-push`

## CI Run #17 → #18: Lint Step Fix (`33ce1f1`)

### Root Cause

**`eslint-plugin-prettier/recommended`** reports formatting violations as **error** level. Phase 2 edits introduced prettier formatting inconsistencies in 2 files (`owner-alerts.functions.ts`, `-admin-alerts.tsx`). Additionally, 7 shadcn/ui component files had pre-existing formatting errors.

### Secondary Issue

Local `bun run lint` hung/timeout because eslint flat config:

- Does **not** auto-ignore dotfiles at the project root (unlike `.eslintrc` format)
- Was scanning `.ctx/`, `.env*`, `.husky/`, `.slim/`, `.tanstack/`, `.vercel/`, `.opencode/`, `.DS_Store`, `.full-stack-feature*/`
- Was recalculating config for each of hundreds of files

### Fixes

1. **`bun run format`** — fixed 2 files with actual formatting changes
2. **`eslint.config.js`** — expanded `ignores` to include all dotfiles and build artifacts:
   ```
   ignores: ["dist", ".output", ".vinxi", ".ctx", ".slim", ".tanstack",
             ".vercel", ".opencode", ".husky", ".full-stack-feature*",
             ".env*", ".DS_Store"]
   ```

### Result

- `eslint .` — 0 errors, 15 warnings (all `warn` level: 7 fast-refresh, 7 no-explicit-any, 1 hook-deps)
- CI run #18 — **success** ✅

---

## PIVOT-PLAN Gaps (`8e9fb28`)

Three remaining gaps identified during the Stripe/pivot cleanup were closed:

### 1. Remove "Seed Demo Data" button from admin dashboard

- Removed the "Seed demo" button from `-admin-dashboard.tsx`
- Removed the auto-seed `useEffect` that ran on dashboard mount
- Cleaned up unused `seedDemoData` import

### 2. Add CRM data table to admin alerts

- Created `getCustomerHistory` server function in `owner-alerts.functions.ts`
  - Returns: `name`, `phone`, `totalVisits`, `completedVisits`, `totalSpent`, `totalTips`, `lastVisit`, `lastStaff`, `lastService`, `lastNotes`, `lastRating`
  - Groups by client, aggregates from bookings + commission_records
- Rewrote `-admin-alerts.tsx` with two sections:
  - **Alerts section** (unchanged UX): unacknowledged low-rating alerts
  - **CRM data table**: searchable, responsive (desktop table / mobile cards)
    - Columns: Name, Phone, Visits, Spent, Tips, Last Visit, Staff, Service, Rating, Notes

### 3. Fix deposit documentation reference

- Removed "optional deposit amount" reference from `docs/onboarding-new-salon.md`
- (Previously missed during the Stripe/deposit pivot cleanup)

---

## Vercel Deployment Fix (`5f48709` → `1303c2c` → `27cc90b` → `2c558e2`)

### Context

After pushing the PIVOT-PLAN gaps, Vercel deployment failed with:

```
Error: Command "bun install" exited with 127
```

### Root Cause

The project has **two lockfiles**: `bun.lock` and `package-lock.json`. On Vercel:

- `bun` is not in PATH by default (exit 127).
- `package-lock.json` has higher auto-detection priority than `bun.lock`, so Vercel picks npm.
- Even when npm auto-detection is used, `npm install` runs the `prepare` lifecycle script (`"prepare": "husky"`), and `husky` is installed **globally** on the dev machine but not listed in `devDependencies`.

### Failed Attempts

| Attempt | Change                                                         | Result                                                                                          |
| ------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1       | `installCommand: "npx bun install"`                            | Exit 127 — `bun` is not an npm package, `npx` can't resolve it                                  |
| 2       | Remove `installCommand`, let Vercel auto-detect                | Auto-detected npm — but `prepare: "husky"` fails because husky not in `devDependencies`         |
| 3       | `prepare: "command -v husky > /dev/null 2>&1 && husky"`        | Still fails — `command -v` exits 1 when husky not found, `&&` propagates the non-zero exit code |
| 4       | `prepare: "command -v husky > /dev/null 2>&1 && husky \|\| :"` | **Success** — `\|\| :` ensures the overall script exits 0 regardless                            |

### Final Config

**`vercel.json`** (no custom `installCommand`):

```json
{
  "buildCommand": "NITRO_PRESET=vercel vite build",
  "framework": "tanstack-start"
}
```

- No `installCommand` → Vercel auto-detects npm from `package-lock.json`
- Build command runs via Node/npm (doesn't need Bun on Vercel)

**`package.json`** prepare script:

```json
"prepare": "command -v husky > /dev/null 2>&1 && husky || :"
```

- When husky is available (local dev): runs `husky` as before
- When husky is missing (CI/Vercel): exits 0 silently

### Verification

- `npm install` succeeds on Vercel: "added 9 packages, removed 64 packages, and changed 169 packages in 7s"
- Vite build completes successfully
- Production domain `nails815.vercel.app` returns HTTP 200

### Documentation Updated

- **`AGENTS.md`**: Added deployment note explaining npm vs Bun on Vercel
- **`docs/DEPLOYMENT_RUNBOOK.md`**: Updated build command, added note about npm auto-detection
- **`docs/onboarding-new-salon.md`**: Added note about Vercel npm auto-detection

---

## Remaining Work

### Blocked — CI Secrets

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SALON_ID`, `VITE_SALON_NAME` must be set as GitHub Actions secrets before CI build job can succeed.

---

## Post-Merge: Origin/main Sync + Lint Fixes (`841432b` → `3efcfad` → `a05a644`)

### Context

Resumed after a previous session gap. The working branch had fallen behind `origin/main` by 6 remote commits (schema barrel exports, strict `no-explicit-any` lint gate, hygiene sweep, `useEffect` dep fix, export move). A full `git merge origin/main` introduced 15 conflicted files.

### Merge Conflict Resolution (15 files)

| File                                                                                  | Strategy            | Detail                                                                                                                                              |
| ------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.js`                                                                    | theirs              | Accept strict lint rules from remote                                                                                                                |
| `.env.example`                                                                        | ours                | Keep `.env.example` (remote had deleted it)                                                                                                         |
| `src/lib/salon.ts`                                                                    | theirs + manual fix | Took remote's `asBusinessHours`, `dayKey`, `Hours`, `BusinessHours` types — but "theirs" was stale, `asBusinessHours` was still missing             |
| `src/routes/auth.tsx`                                                                 | theirs              | Uses `getErrorMessage` utility                                                                                                                      |
| `src/lib/admin.functions.ts`                                                          | ours                | Needs `BookingInsert`/`CommissionRecordInsert` from `rows.ts` barrel; removed unused `z` import                                                     |
| `src/lib/utils.ts`                                                                    | ours + theirs       | Ours base + added JSDoc comments back                                                                                                               |
| `src/routes/index.tsx`                                                                | combined            | Ours base + combined imports (`asBusinessHours`, `DayKey` from theirs); used `asBusinessHours` for hours display; fixed extra `</div>` syntax error |
| `src/routes/_authenticated/-admin-commissions.tsx`                                    | combined            | Ours (Check/X icons for paid toggle) + theirs (null-safe date display)                                                                              |
| Route files (alerts, calendar, calls, dashboard, staff/index, appointments, services) | ours                | Simple import diff conflicts                                                                                                                        |

### Pre-commit Hook Iterations

1. **Syntax error**: Extra `</div>` in `index.tsx` → fixed
2. **4 lint errors**: `tipSplit`→`_tipSplit`, removed unused `X`, `BusinessHours`, `servicesLoading` → fixed
3. **Passed**: Merge commit `841432b` created

### Build Failure — `asBusinessHours` Not Exported (`3efcfad`)

- `asBusinessHours` was referenced in `index.tsx` (from remote's changes) but our `salon.ts` version didn't export it
- The remote version had it, but our merge resolution for `salon.ts` used a "theirs" version that was stale
- **Fix**: Added the `asBusinessHours` type narrowing helper:
  ```ts
  export function asBusinessHours(value: unknown): BusinessHours {
    return (value ?? {}) as BusinessHours;
  }
  ```
- Build now passes clean

### CI Lint Failures — 8 Unused Variable Errors (`a05a644`)

Remote's strict `@typescript-eslint/no-unused-vars` rule (`/^_/u` prefix pattern) flagged pre-existing unused variables in files we kept "ours" during the merge:

| File                   | Line | Variable               | Fix                     |
| ---------------------- | ---- | ---------------------- | ----------------------- |
| `-admin-dashboard.tsx` | 29   | `BookingWithRelations` | `_BookingWithRelations` |
| `-admin-dashboard.tsx` | 57   | `qc`                   | `_qc`                   |
| `-admin-dashboard.tsx` | 200  | `maxRev`               | `_maxRev`               |
| `-admin-waitlist.tsx`  | 39   | `fulfillEntry`         | `_fulfillEntry`         |
| `-admin-waitlist.tsx`  | 44   | `cancelEntry`          | `_cancelEntry`          |
| `staff/index.tsx`      | 3    | `supabase` import      | Removed unused import   |
| `staff/index.tsx`      | 29   | `staffId`              | `_staffId`              |
| `book.tsx`             | 7    | `fmtMoney` import      | Removed from import     |

- All fixed with underscore prefix convention or import removal
- Local `bun run lint`: 0 errors ✅
- CI (run for `a05a644`): **success** ✅
- GitHub push confirmed: `3efcfad..a05a644 main → main`

### Vercel Deployment Verification

- Production domain `https://nails815.vercel.app` returns HTTP 200
- Vercel production deployment **Ready** (triggered by push)
- Site renders: hero, services, hours, studio info, booking flow

### Key Takeaways

- **CI runs `eslint . --max-warnings 0`** on the full codebase (not just staged files), so pre-existing unused variables in non-staged files are caught at CI even if pre-commit hooks pass
- **Merge resolution must respect both codebases** — "theirs" in index may be stale if the remote resolved after a prior merge
- **GitHub → Vercel auto-deploy** works correctly with the npm-based `prepare` script fix from earlier today

### Upcoming Phases (from TECH-DEBT plan)

- **Phase 3**: Schema exports cleanup
- **Phase 4**: Decomposition (large files)
- **Phase 5**: Cleanup (dead code, unused imports, file reorganization)

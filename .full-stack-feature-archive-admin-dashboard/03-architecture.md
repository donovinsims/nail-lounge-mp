# Architecture: Admin Dashboard Tables & Widgets

## Overview

This is a **pure frontend UI modernization** of the admin dashboard at `src/routes/_authenticated/admin.tsx`. All 8 admin tabs get componentized refactors using shadcn/ui components + Recharts for charts, inspired by TypeUI.sh table and widget patterns.

No backend, database, or business logic changes.

---

## Current File Structure (target for refactor)

```
src/routes/_authenticated/
├── route.tsx          # Auth gate layout
└── admin.tsx          # ALL admin views in one 904-line file
```

**Target structure:**

```
src/routes/_authenticated/
├── route.tsx
├── admin.tsx                          # Shell (sidebar + tab routing, ~100 lines)
├── -admin-dashboard.tsx               # Dashboard — KPI widgets + charts
├── -admin-calendar.tsx                # Calendar — improved day view
├── -admin-floor.tsx                   # Live Floor — improved staff cards
├── -admin-pos.tsx                     # POS — improved checkout panel
├── -admin-commissions.tsx             # Commissions — data table
├── -admin-waitlist.tsx                # Waitlist — improved list
├── -admin-calls.tsx                   # AI Calls — improved cards
├── -admin-settings.tsx                # Settings — unchanged (already fine)
└── -admin-components/
    ├── kpi-card.tsx                   # Reusable KPI stat card widget
    ├── data-table.tsx                 # Reusable data table with search/filter/sort
    ├── status-badge.tsx               # Reusable status badge
    └── widgets.tsx                    # Chart widget helper components
```

---

## TypeUI.sh Options Mapping

### Tables (9 layouts available → 3 primary patterns selected)

| TypeUI Option                                | Applied To              | Rationale                                                                                                          |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Filterable Management Data Table** (#4)    | Commissions             | Sortable columns, status radio filters, footer totals. Closest match to commissions data (amounts, status, dates). |
| **Expandable Detail Data Table** (#5)        | Calendar                | Expandable rows with inline detail panel — shows booking details on expand.                                        |
| **Item Workflow Data Table** (#7)            | Waitlist / AI Calls     | Progress, time tracking, status indicators pattern. Good for waitlist status and AI call intents.                  |
| **Summary Metrics Data Table** (#2)          | Dashboard bookings list | Summary stats + compact rows for today's schedule.                                                                 |
| **Request Queue Data Table** (#8)            | AI Calls                | Priority badges, agent assignment pattern — maps to call intent + handling status.                                 |
| **Selectable Amount Status Data Table** (#9) | POS                     | Transactions with sortable columns and row action menus — maps to open tickets.                                    |

### Widgets (50 layouts available → grouped into patterns)

| TypeUI Widget Category | Applied To                | Specific Patterns                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KPI Stat Card**      | Dashboard stat rows       | `Compact Metric Stat Card` (#25), `Icon Labeled Stat Card With Trend Comparison` (#33), `Widget With Trend Badge` (#32), `Widget With Left Icon And Text` (#36)                                                                                            |
| **Chart Widgets**      | Dashboard                 | `Dashboard Metrics Chart Widget` (#1 — KPI + icon + trend + bar chart), `Dual KPI Line Chart Widget` (#5 — dual metric line chart), `Filterable Donut Chart Widget` (#4 — donut with checkboxes), `Income Expense Bar Chart Widget` (#8 — horizontal bars) |
| **List Widgets**       | Waitlist, AI Calls, Floor | `List Widget With Avatars And Status Indicators` (#37), `List Widget With Avatars And Action Buttons` (#42), `List Widget With Status Indicators` (#37)                                                                                                    |

---

## Component Design per Tab

### 1. Dashboard Tab

**Current:** 3 `<Stat>` cards (bookings count, revenue, confirmed) + plain schedule list. No charts.

**Target:** Grid layout with:

- **Row 1: KPI Widget Row** — 3-4 enriched stat cards:
  - Today's Bookings (with trend badge vs yesterday)
  - Revenue Today (with dollar sign icon, trend indicator)
  - Confirmed (with percentage of total)
  - Avg Ticket (with comparison)
- **Row 2: Chart Row (2-column)**:
  - Left: Bar chart — revenue this week by day (TypeUI #1 pattern)
  - Right: Donut chart — service category distribution (TypeUI #4 pattern)
- **Row 3: Schedule List** — improved with search filter, time grouping, status badges

**Components used:** shadcn/ui Card, Badge, shadcn/ui chart (Recharts), custom KpiCard

### 2. Calendar Tab

**Current:** 14-day date picker + plain hour rows with colored blocks.

**Target:** Same 14-day date picker + improved day view:

- Each hour slot with better booking cards (avatar, service name, client name, status badge)
- Expandable booking detail on click (TypeUI #5 pattern)
- Color-coded by staff member (already exists, improve styling)

**Components used:** shadcn/ui Card, Badge, Avatar, existing date navigation

### 3. Live Floor Tab

**Current:** Simple staff cards with status badge, tap to cycle. Real-time.

**Target:** Same functionality, improved cards:

- Better avatar display with status ring indicator
- Animated status transitions
- Service in progress info (if `with_client`)
- Duration timer for `with_client` status

**Components used:** shadcn/ui Avatar, Badge, Card

### 4. POS Tab

**Current:** 2-column layout (open tickets list + checkout panel). Basic range sliders.

**Target:** Same 2-column layout, improved:

- Ticket cards with better visual hierarchy (TypeUI #9 — selectable rows)
- Checkout panel with better tip selection (button grid, not just slider)
- Animated payment state

**Components used:** shadcn/ui Card, Button, Radio Group, Badge

### 5. Commissions Tab

**Current:** Raw `<table>` with CSV export. No search, filter, sort, pagination.

**Target:** Full data table (TypeUI #4 — Filterable Management Data Table):

- Search input (filter by tech name, service name)
- Status/date filter dropdowns
- Sortable columns (date, gross, tech share, tip)
- Footer row with totals
- Pagination (20 per page)
- CSV export preserved

**Components used:** shadcn/ui Table, Input, Select, Button, Badge, shadcn/ui Pagination (or custom)

### 6. Waitlist Tab

**Current:** Simple add form + plain list.

**Target:** Improved list (TypeUI #7 — Item Workflow pattern):

- Better add form with card container
- List items with status badges, timestamps
- Flagged entries visually distinct
- Empty state with illustration

**Components used:** shadcn/ui Card, Badge, Input, Button

### 7. AI Calls Tab

**Current:** Simple list with card-like items.

**Target:** Improved cards (TypeUI #8 — Request Queue pattern):

- Each call as a proper card with header (caller name + phone), intent badge, transcript excerpt
- "Convert to booking" CTA more prominent
- Sorted by date, filterable by intent

**Components used:** shadcn/ui Card, Badge, Button

### 8. Settings Tab

**Current:** Functional forms with range sliders. Already decent.

**Target:** Minimal polish — improved form layout using shadcn/ui Card, better input groups. Lowest priority.

**Components used:** shadcn/ui Card, Input, Slider, Button

---

## Shared Components

### KpiCard (`-admin-components/kpi-card.tsx`)

```tsx
interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ElementType;
  trend?: { direction: "up" | "down"; value: string };
  sub?: string;
  chart?: React.ReactNode; // Optional sparkline
}
```

### DataTable (`-admin-components/data-table.tsx`)

A reusable wrapper around shadcn/ui Table with:

- Search input
- Column sorting (click header to sort)
- Filter dropdowns
- Pagination
- Row actions dropdown
- Footer totals row

---

## Color & Design System

All existing color tokens preserved (`--color-primary`, `--color-accent`, `--color-chart-1` through `--chart-5`). The chart colors are already defined in `src/styles.css`:

```css
--chart-1: oklch(0.28 0.08 350);  // Deep plum
--chart-2: oklch(0.55 0.12 20);   // Warm rust
--chart-3: oklch(0.7 0.1 25);     // Blush
--chart-4: oklch(0.6 0.08 340);   // Rose
--chart-5: oklch(0.62 0.13 150);  // Green
```

These map directly to Nail Lounge brand colors. No theme changes needed.

---

## Data Fetching

No changes to TanStack Query patterns. Each tab component keeps its existing `useQuery` calls. Only the presentation layer changes.

---

## Risk Assessment

| Risk                                    | Impact | Mitigation                                                                      |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Large file (904 lines) hard to refactor | Medium | Extract one tab at a time. Each extraction is ~100 lines.                       |
| Recharts SSR compatibility              | Low    | Charts are client-only. Use TanStack Router's SSR:false or client-only wrapper. |
| Realtime floors subscription breaks     | Medium | Keep subscription logic exactly as-is, only change the presentation JSX.        |
| Mobile responsiveness of charts         | Low    | Recharts has responsive containers. Use aspect ratio for mobile.                |

---

## Implementation Order (recommended)

1. **Shared components** — KpiCard, DataTable, StatusBadge (prerequisites)
2. **Dashboard** — biggest visual impact, shows progress quickly
3. **Commissions** — most needed improvement (raw table → proper data table)
4. **Calendar** — moderate improvement
5. **Waitlist + AI Calls** — similar list patterns, do together
6. **Floor + POS** — moderate improvement
7. **Settings** — minimal polish, lowest priority
8. **Cleanup** — verify all tabs, remove old code, test

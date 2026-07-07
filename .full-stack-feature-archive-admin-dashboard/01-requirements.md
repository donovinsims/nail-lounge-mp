# Requirements: Admin Dashboard Tables & Widgets — Replace Bare Data Views with TypeUI.sh-Inspired Data Tables and KPI/Chart Widgets

## Problem Statement

The Nail Lounge admin dashboard (`/_authenticated/admin`) has functional data views but visually basic presentation:

1. **Dashboard** — Stat cards show only raw numbers (`<Stat>` component with just label + value). No charts, no trend indicators, no visual data density. Today's schedule is a plain list.
2. **Commissions** — Uses a raw HTML `<table>` with basic styling. No search, filter, sort, pagination, or row actions.
3. **Waitlist** — Simple list with inline add form.
4. **AI Calls** — Simple list with basic info.
5. **Calendar** — Plain day schedule with minimal visual hierarchy.
6. **Live Floor** — Basic cards with status badge.
7. **POS** — Functional but visually sparse.

The user wants to modernize all these views using TypeUI.sh design patterns for data tables (search, filter, sort, pagination, expandable rows, row actions) and dashboard widgets (KPI cards with trend badges, chart widgets with bar/line/donut charts).

## Acceptance Criteria

- [ ] Dashboard gets widget-based KPI cards (trend badges, secondary stats, icon labels) replacing simple `<Stat>` components
- [ ] Dashboard gets chart widgets (bar/line/donut) showing revenue trends, booking volume, service distribution
- [ ] Commissions table gets search, filters, sortable columns, pagination, and improved visual hierarchy
- [ ] Calendar view gets better visual timeline with booking cards
- [ ] Waitlist gets improved list patterns with status indicators
- [ ] AI Calls gets improved list/card patterns
- [ ] Live Floor gets improved staff cards
- [ ] POS gets improved ticket selection and checkout panel
- [ ] All views maintain the existing Nail Lounge brand colors and design system
- [ ] All views remain fully functional — no regressions in data fetching or mutations
- [ ] Responsive: works on mobile (existing bottom nav) and desktop (sidebar)
- [ ] All charts use the existing Recharts library (already present or added if missing)

## Scope

### In Scope

- Refactor all 8 admin tabs (Dashboard, Calendar, Floor, POS, Commissions, Waitlist, AI Calls, Settings)
- Replace raw `<table>` with modern data table patterns
- Replace `<Stat>` cards with richer KPI widgets
- Add chart visualizations to Dashboard
- Add search/filter/sort/pagination to data views
- Improve card/list patterns across all views

### Out of Scope

- No changes to the client-facing website (homepage, services, booking, gallery, etc.)
- No new database tables or backend routes (using existing Supabase queries)
- No auth changes
- No routing changes
- No new feature functionality — purely UI modernization

## Technical Constraints

- Must use Tailwind CSS v4 (`@import "tailwindcss"` syntax) — no CSS modules or styled-components
- Must use shadcn/ui components where appropriate
- Must use TanStack Query (`@tanstack/react-query`) for data fetching (already in use)
- Charts should use Recharts (check if in package.json — if not, add it)
- All existing data fetching patterns must be preserved (Supabase client queries + server functions)
- Must maintain existing color tokens and design system (warm ivory/blush/plum theme)
- Must work with existing sidebar/mobile nav pattern
- No changes to `src/lib/` business logic or server functions
- No new external dependencies beyond Recharts (if not already present)

## Technology Stack

- **Frontend Framework:** TanStack Start + React 19 + TanStack Router
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style)
- **Charts:** Recharts (confirm/add in package.json)
- **State Management:** TanStack Query (existing)
- **Data:** Supabase (existing queries)

## Dependencies

- Recharts may need to be added to package.json
- No changes to Supabase schema or backend required
- No changes to server functions or API layer

## Configuration

- Stack: tanstack-start
- API Style: rest
- Complexity: medium

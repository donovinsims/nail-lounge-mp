# Database Design: Admin Dashboard Tables & Widgets

## No Database Changes Required

This feature is a **strictly frontend UI modernization** of the existing admin dashboard views. No new tables, columns, indexes, or migrations are needed.

### Existing Schema (unaffected)

All data views already query these existing Supabase tables via TanStack Query:

| Admin View  | Source Table(s)                          | Query Pattern                                             |
| ----------- | ---------------------------------------- | --------------------------------------------------------- |
| Dashboard   | `bookings`, `commission_records`         | `supabase.from("bookings").select(...)` with date filters |
| Calendar    | `bookings`                               | Same as dashboard but with date navigation                |
| Live Floor  | `floor_status` (+ `staff`)               | Real-time via Supabase channel                            |
| POS         | `bookings` (status=confirmed)            | Simple filtered query                                     |
| Commissions | `commission_records` (+ staff, bookings) | Ordered, limited to 200                                   |
| Waitlist    | `waitlist_entries` (+ staff, services)   | Ordered descending                                        |
| AI Calls    | `ai_calls`                               | Ordered descending                                        |
| Settings    | `salons`                                 | Direct upsert                                             |

### Data Flow (unchanged)

```
React Component → TanStack Query → supabase.from().select() → Supabase REST → React Component
```

No server functions, RPCs, or backend routes are touched. All data fetching stays client-side via TanStack Query as it is today.

### Verification

- All existing Supabase queries remain identical — only the presentation layer changes
- Real-time subscriptions (floor status) remain untouched
- CSV export (commissions) remains untouched

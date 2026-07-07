# UX Principles: Design of Everyday Things applied to the Admin Dashboard

## Business Owner's Daily Flow (Conceptual Model)

The business owner's mental model of their day:

```
1. OPEN dashboard → "How's my business today?"
2. CHECK calendar → "Who's coming when?"
3. SEE floor → "What's happening right now?"
4. PROCESS bookings → POS check-in/checkout
5. REVIEW commissions → "What did my team earn?"
6. MANAGE waitlist → "Can we fit more people?"
7. HANDLE AI calls → "Any phone leads?"
8. ADJUST settings → occasional
```

**The tab order already matches this mental model.** We reinforce it by making Tab 1 (Dashboard) truly useful — it should answer the owner's morning question immediately.

## Applying the 7 Principles

### 1. Discoverability

**Target:** Owner opens admin and instantly knows where everything is.

| Application                    | How                                                               |
| ------------------------------ | ----------------------------------------------------------------- |
| Tab labels with matching icons | Calendar + today's date badge, bell on waitlist count             |
| 8 tabs always visible          | No hamburger menus or overflow on desktop                         |
| No buried features             | Every major action (add to waitlist, complete booking) is 1 click |

### 2. Affordances

**Target:** Every interactive element clearly signals it's interactive.

| Element          | Affordance Signaled           | Visual Cue                                   |
| ---------------- | ----------------------------- | -------------------------------------------- |
| Tab buttons      | Clickable → active view       | Active state (filled bg) vs inactive (ghost) |
| Data table rows  | Clickable → expand/edit       | Hover highlight, pointer cursor              |
| Stat cards       | Informational (not clickable) | Flat, no hover effect                        |
| Action buttons   | Triggers operation            | Button shadow, icon + label                  |
| Sortable columns | Click to sort                 | Caret icon on hover                          |

### 3. Signifiers

**Target:** Never leave the owner wondering what something means.

| Pattern         | Signifier                                                        |
| --------------- | ---------------------------------------------------------------- |
| Status badges   | Color-coded: green = confirmed, amber = pending, red = cancelled |
| Pending actions | Bell/dot indicator on Waitlist tab                               |
| Empty states    | Illustration + message + next action button                      |
| Amounts         | Always show `$` prefix, right-aligned in columns                 |
| Dates           | Relative for today ("Today 2:30 PM"), absolute for other days    |

### 4. Mappings

**Target:** Layout matches the owner's mental model.

| Principle  | Application                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Proximity  | Controls near the data they affect (edit inline, not in a modal)                                               |
| Sequential | Tab order = daily workflow (Dashboard → Calendar → Floor → POS → Commissions → Waitlist → AI Calls → Settings) |
| Cultural   | Red = bad/error, green = good/confirmed, amber = pending/warning                                               |
| Natural    | Left-to-right = past to future in calendar; up = increase in sort                                              |

### 5. Constraints

**Target:** Prevent errors before they happen.

| Constraint                  | Implementation                               |
| --------------------------- | -------------------------------------------- |
| Disabled submit             | Submit button disabled until form validates  |
| Date boundaries             | Cannot book in the past (date picker)        |
| Amount validation           | Dollar inputs reject non-numeric chars       |
| Confirm destructive actions | "Cancel booking?" dialog → reason → confirm  |
| Prevent double-submit       | Button shows "Saving..." spinner after click |

### 6. Feedback

**Target:** Every action gets immediate, clear feedback.

| Action              | Feedback                                             |
| ------------------- | ---------------------------------------------------- |
| Tab switch          | Content transitions instantly                        |
| Data mutation       | `sonner` toast: "Booking completed" or error message |
| Loading data        | Skeleton loaders (not spinners) per section          |
| Save settings       | "Settings saved." toast                              |
| Floor status change | Inline badge animates to new color                   |
| Sort/filter change  | Table rows smoothly update (no page reload)          |

### 7. Conceptual Model

**Target:** The admin dashboard should feel like a well-organized salon front desk.

| System Image                             | Intended User Model                        |
| ---------------------------------------- | ------------------------------------------ |
| Dashboard = "front desk clipboard"       | Shows today's numbers at a glance          |
| Calendar = "appointment book"            | Chronological timeline of today's bookings |
| Live Floor = "glance at the salon floor" | Shows who's with whom, who's free          |
| Commissions = "payroll log"              | Shows what each tech earned                |
| Waitlist = "call-back list"              | Shows who's waiting for a slot             |

## Bridging the Two Gulfs

### Gulf of Execution — "How do I \_\_\_?"

| Owner Wants To          | Action                                                    | Bridged By                                  |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------- |
| See today's revenue     | Open Dashboard (Tab 1) — it's the first thing they see    | Clear hierarchy, KPI cards front and center |
| Complete a booking      | Floor view → tap staff card → POS opens with their client | Natural flow from check-in to checkout      |
| Find a past booking     | Commission table → search by client name                  | Search affordance visible immediately       |
| Add someone to waitlist | Waitlist tab → "Add to Waitlist" button                   | Primary action obvious, form is inline      |

### Gulf of Evaluation — "Did it work?"

| Owner Action         | Confirmation                                                              | Bridged By                   |
| -------------------- | ------------------------------------------------------------------------- | ---------------------------- |
| Completed booking    | "Booking completed!" toast + KPI card updates + commission list refreshes | Toast + live data update     |
| Changed floor status | Staff card badge animates from "Available" → "With Client"                | Immediate visual change      |
| Saved settings       | "Settings saved." toast                                                   | Toast confirmation           |
| Filtered commissions | Table shows only matching rows                                            | Filter chips + results count |

## Quick Audit Score

Current admin: **4/10** — Functional but lacking feedback, discoverability issues (raw table with no affordances), no trend context.

Target: **9/10** — Clear information hierarchy, immediate feedback on all actions, zero-confusion navigation, delightful visual polish.

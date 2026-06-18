# Phase 2: Desktop Checkout Page

> Replace the centered Dialog modal with a full-page two-column layout on desktop (≥768px).
> The booking flow becomes a proper page — no more overlay.

---

## Goal

Transform `/book` on desktop from a background hero + overlay Dialog into a cohesive full-page checkout experience with the step content in the main column and a sticky order summary sidebar.

---

## Dependencies

- **Phase 1 must be complete** — step components extracted, URL-driven state working.

---

## Layout Design

```
┌──────────────────────────────────────────────────────────────┐
│  SiteHeader (sticky)                                          │
├───────────────────────────────────────────┬──────────────────┤
│  ← Back to site                           │                  │
│                                           │  ┌────────────┐ │
│  Step 1  ○───○───○───○  Step 4           │  │ Your       │ │
│         Svc  Art  Time  Cfm               │  │ Booking    │ │
│                                           │  │            │ │
│  ┌─────────────────────────────────────┐  │  │ Service:   │ │
│  │                                     │  │  │ Gel Mani   │ │
│  │       [Step content]                │  │  │ Artist:    │ │
│  │                                     │  │  │ Mia Tran   │ │
│  │  ○ Service 1  $25                   │  │  │ Time:      │ │
│  │  ○ Service 2  $40                   │  │  │ Fri Jun 20 │ │
│  │  ○ Service 3  $53                   │  │  │ 2:00 PM    │ │
│  │                                     │  │  │            │ │
│  └─────────────────────────────────────┘  │  Total: $40 │ │
│                                           │  Deposit:   │ │
│  [Continue button — full width]            │    $10      │ │
│                                           │  └────────────┘ │
│                                           │  (sticky —      │
│                                           │   scrolls with  │
│                                           │   page)         │
├───────────────────────────────────────────┴──────────────────┤
│  SiteFooter                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Files to Create

### 1. `src/routes/book/-booking-layout-desktop.tsx`

The two-column shell for the desktop booking page.

**Props:**

```ts
{
  step: number;
  onStepClick: (s: number) => void;
  onBack: () => void;
  summary: ReactNode;        // <BookingSummary /> instance
  children: ReactNode;       // step content
  footer: ReactNode;         // Continue button or submit
}
```

**Layout:**

```
<div class="min-h-screen bg-background">
  <SiteHeader />
  <div class="mx-auto max-w-7xl px-6 py-10">
    <Link to="/services">← Back to services</Link>

    <!-- Step progress -->
    <div class="mt-6"><BookingStepProgress /></div>

    <!-- Two-column grid -->
    <div class="mt-10 grid grid-cols-12 gap-10">
      <!-- Step content (left) -->
      <div class="col-span-7">
        {children}
        <div class="mt-8">{footer}</div>
      </div>
      <!-- Summary sidebar (right) -->
      <aside class="col-span-5">
        <div class="sticky top-24">{summary}</div>
      </aside>
    </div>
  </div>
</div>
```

**Responsive note:** This component only renders at ≥768px. The mobile layout is in Phase 3.

---

## Files to Modify

### `src/routes/book.tsx`

**Changes:**

1. Remove the Desktop Dialog branch:
   ```tsx
   // DELETE this block:
   {hydrated && !isMobile ? (
     <Dialog open={open} onOpenChange={...}>
       <DialogContent>...</DialogContent>
     </Dialog>
   ) : ...}
   ```
2. Replace with the desktop layout component at ≥768px:
   ```tsx
   {hydrated && !isMobile ? (
     <BookingLayoutDesktop ...>
       {bookingStepContent}
     </BookingLayoutDesktop>
   ) : ...}
   ```
3. Remove `const [open, setOpen] = useState(true)` — no longer needed
4. Remove `const close = () => { ... }` — page-level navigation replaces modal close
5. Add "Back to services" link on step 1 that navigates to `/services`
6. Add "Back to previous step" on steps 2+ that uses `navigate` with decremented step param
7. The "Continue" button in the footer (steps 1-3) should remain, now at the bottom of the left column
8. The "Pay deposit" button (step 4) should remain in the step content
9. Remove the hero section (the background image + "Reserve your seat" heading) — the page is now a functional checkout, not a marketing hero. Replace with a simpler page title + step indicator.

**What the new `/book` page looks like on desktop (entirely):**

```tsx
<div class="min-h-screen bg-background text-foreground">
  <SiteHeader />
  <div class="mx-auto max-w-7xl px-6 py-10">
    <Link to="/" class="text-sm text-muted-foreground">← Back</Link>

    <div class="mt-4">
      <h1 class="font-display text-4xl">Book your appointment</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Complete the steps below to reserve your seat.
      </p>
    </div>

    <BookingStepProgress step={step} onStepClick={goToStep} />

    <div class="mt-10 grid grid-cols-12 gap-10">
      <div class="col-span-7 space-y-8">
        {stepBody}
        <div class="pt-4">{stepFooter}</div>
      </div>
      <aside class="col-span-5">
        <div class="sticky top-24 space-y-4">
          <BookingSummary ... />
        </div>
      </aside>
    </div>
  </div>
</div>
```

### Remove these imports from `book.tsx`:

```tsx
// DELETE:
import { BottomSheet } from "@/components/bottom-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
```

The desktop path no longer uses Dialog at all. Only mobile will still use BottomSheet (to be replaced in Phase 3).

---

## Verification Checklist

- [ ] `bun run build` succeeds
- [ ] Desktop (≥768px): Booking flow renders as a full-page layout, not a modal
- [ ] No hero background image or "Reserve your seat" heading on `/book` page
- [ ] Two-column layout: step content left, summary sidebar right
- [ ] Summary sidebar is sticky and updates on each step
- [ ] Step progress indicator is clickable (completed steps navigate back)
- [ ] "← Back" link at top navigates appropriately (previous step or to home/services)
- [ ] Continue button is at the bottom of the left column (not floating)
- [ ] Step 4 shows the confirm form + payment in the left column, summary on right
- [ ] Resizing from desktop to mobile breakpoint triggers the mobile layout (still BottomSheet)
- [ ] All step state (service, staff, step number) is preserved in URL params
- [ ] Browser back button goes to previous step (not navigating away from the page)
- [ ] Services page "Book Now" with `?service=uuid` still pre-selects correctly
- [ ] No regressions on mobile path (still uses BottomSheet from Phase 1)
- [ ] Focus management works — first interactive element in step is focused
- [ ] Scrolling works naturally (page scroll, not nested modal scroll)

---

## Tooling & Execution

### Design Resources

Load these skills before any visual/structural work:

```
skill("design-everyday-things")   // two-column layout affordances, back navigation mental model
skill("ui-ux-pro-max")            // responsive layout patterns, sticky sidebar patterns
```

These inform the desktop layout decisions — proper visual hierarchy, consistent spacing, readable content widths.

### TypeUI MCP

Available for generating Tailwind layout code, suggesting grid/flexbox patterns, and responsive breakpoint implementations. Query it for "two-column checkout layout" or "sticky sidebar pattern" as needed.

### Parallel Execution Strategy

Phase 2 is mostly a single-file rewrite (`book.tsx`) plus optional layout extraction, so parallelism is limited:

1. **Orchestrator** modifies `book.tsx` — remove Dialog branch, inject desktop layout, remove hero background, clean imports
2. **One optional background task** (parallel with the above if done independently):
   ```
   task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-booking-layout-desktop.tsx — responsive two-column layout shell. Props: { step, onStepClick, onBack, summary: ReactNode, children: ReactNode, footer: ReactNode }. SiteHeader at top, back link, step progress, 12-col grid (7+5) for content+sticky sidebar. Tailwind, responsive.")
   ```
3. After the layout is set, do a responsive visual review pass

### Execution Workflow

1. Load design skills with `skill()` calls
2. (Optional) dispatch layout component as background task
3. Orchestrator rewrites `book.tsx`: remove Dialog, inject desktop layout, remove hero section
4. Remove unused Dialog imports from `book.tsx`
5. Run `bun run build` to verify
6. Test all edge cases in verification checklist above

# Phase 3: Mobile Checkout Page

> Replace the Vaul BottomSheet drawer with a full-page single-column layout on mobile (<768px).
> No more swipe-to-dismiss, no more modal overlay — the booking flow owns the full viewport.

---

## Goal

Transform `/book` on mobile from a background hero + draggable bottom sheet into a purpose-built full-height checkout page optimized for touch. Every pixel is dedicated to the booking flow.

---

## Dependencies

- **Phase 1 must be complete** — step components, URL-driven state.
- **Phase 2 is NOT required** — mobile can be done independently of desktop.

---

## Layout Design

```
┌──────────────────────────┐
│  ← Back    Step 2 of 4   │   <- Sticky top bar
│                           │
│  ○───○───○───○           │   <- Step progress
│  Svc Art Time Cfm         │      (smaller on mobile)
│                           │
│  ┌─────────────────────┐  │
│  │                     │  │
│  │   [Step content]    │  │   <- Scrollable step area
│  │                     │  │
│  │   ○ Service 1  $25  │  │
│  │   ○ Service 2  $40  │  │
│  │   ○ Service 3  $53  │  │
│  │                     │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │   Continue          │  │   <- Fixed bottom CTA
│  │   Total: $40 ·      │  │      (or Pay $10 deposit)
│  │   Deposit: $10      │  │
│  └─────────────────────┘  │
└──────────────────────────┘
```

**Key difference from current:** The bottom sheet was a drag-up overlay with the hero page visible behind it. The new mobile page is the full viewport — no background content, no swipe-to-dismiss.

---

## Files to Modify

### `src/components/bottom-sheet.tsx`

**This file will be deleted.** But not yet — it's still used by `/services` on mobile for the service detail popup. That gets replaced in Phase 4. For Phase 3, `/book` simply stops using it.

### `src/routes/book.tsx`

**Changes:**

1. Remove the mobile BottomSheet branch:
   ```tsx
   // DELETE this block:
   {hydrated && isMobile ? (
     <BottomSheet open={open} onOpenChange={...} title={...} footer={...}>
       {bookingStepContent}
     </BottomSheet>
   ) : ...}
   ```
2. Replace with the mobile page layout:
   ```tsx
   {hydrated && isMobile ? (
     <MobileBookingPage ...>
       {bookingStepContent}
     </MobileBookingPage>
   ) : ...}
   ```
3. The mobile layout wraps the entire page — no `SiteHeader` needed on mobile (the page has its own top bar with back button and step counter). Actually, check if SiteHeader should still be shown. Decision: **show a compact SiteHeader** on mobile (logo only, no nav links), since the user may want to navigate back to the site.

4. Remove the hero section entirely (already removed in Phase 2 for desktop, but mobile still needs it removed too).

**New mobile page structure:**

```tsx
{hydrated && isMobile ? (
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    {/* Compact header — logo only */}
    <header class="border-b border-border/60 px-4 py-3">
      <Link to="/" class="font-display text-xl italic">Nail Lounge</Link>
    </header>

    {/* Back + step counter */}
    <div class="flex items-center justify-between px-4 pt-4">
      <button onClick={handleBack} class="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft class="h-4 w-4" /> Back
      </button>
      <span class="text-xs font-mono text-muted-foreground">Step {step}/4</span>
    </div>

    {/* Step progress */}
    <div class="mt-4 px-4">
      <BookingStepProgress step={step} onStepClick={goToStep} />
    </div>

    {/* Collapsible order summary bar */}
    <div class="mt-4 px-4">
      <MobileBookingSummaryBar ... />
    </div>

    {/* Scrollable step content */}
    <div class="flex-1 overflow-y-auto px-4 py-6">
      {stepBody}
    </div>

    {/* Fixed bottom CTA */}
    <div class="sticky bottom-0 border-t border-border bg-background px-4 py-4 safe-pb">
      {stepFooter}
    </div>
  </div>
) : ...}
```

### Create: mobile summary bar inline or as a component

**`src/routes/book/-booking-summary-bar.tsx`** (mobile variant of the summary)

A compact collapsible bar at the top of the mobile page showing current selections:

```
┌─────────────────────────────────────────────┐
│ ▼ Your selections                     $40   │  <- tappable to expand
│   Gel Manicure · Mia Tran · Fri Jun 20      │
│   2:00 PM                                   │
└─────────────────────────────────────────────┘
```

**Props:** Same as `BookingSummary`.

On mobile, this serves the same role as the desktop sidebar but in a compact horizontal strip. It should be collapsible (tapping it toggles a small dropdown with the full breakdown).

---

## Mobile-Specific UX Concerns

### 1. Safe Areas

Use existing `safe-pb` and `safe-pt` utilities for iOS notch and home indicator:

```html
<div class="sticky bottom-0 ... safe-pb">...CTA...</div>
```

### 2. Keyboard Handling

When the user focuses the name/phone/email fields on step 4:

- The fixed bottom CTA must move above the virtual keyboard
- Use `visualViewport` API or a simple `input focus → scroll into view` approach
- Test on iOS Safari specifically

### 3. No Swipe-to-Dismiss

One of the biggest problems with the Vaul BottomSheet was accidental dismissal. The new mobile page is a hard page — no swipe gestures that destroy state. The user must explicitly tap "Back" or navigate away.

### 4. Touch Targets

All interactive elements must be minimum 44×44px. The existing `tap-target` utility class should be on all buttons. Verify:

- Service selection cards
- Staff selection cards
- Date buttons
- Time slot buttons
- Continue/Pay button
- Back button

### 5. Step Transition Animations

Subtle slide animations between steps improve the feel:

- Step content fades in + slides left (forward) or right (backward)
- Use Tailwind `animate-in` utilities or simple CSS transitions
- Duration: 200-300ms, ease-out
- Respect `prefers-reduced-motion`

```css
/* Example approach */
.step-enter {
  animation: slideIn 0.25s ease-out;
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Verification Checklist

- [ ] `bun run build` succeeds
- [ ] Mobile (<768px): Booking flow renders as a full-page layout, not a bottom sheet
- [ ] No swipe-to-dismiss gesture (accidental close is impossible)
- [ ] "Back" button at top navigates to previous step or to home
- [ ] Step progress shows compactly at top
- [ ] Order summary bar shows current selections, is collapsible
- [ ] Fixed bottom CTA shows "Continue" or "Pay $X deposit" appropriately
- [ ] Step content scrolls independently (full page scroll)
- [ ] iOS safe areas respected (notch, home indicator)
- [ ] Keyboard does not hide the submit button on step 4
- [ ] All touch targets are ≥44px (tap-target class)
- [ ] Step transitions animate smoothly
- [ ] Reducing motion preference respected
- [ ] Desktop path still works (unaffected by this change)
- [ ] No hero background visible behind the booking flow
- [ ] Resize from mobile to desktop breakpoint switches layouts correctly

---

## Tooling & Execution

### Design Resources

Load these skills before any mobile layout work — this phase has the most UX-critical decisions:

```
skill("design-everyday-things")   // mobile affordances, touch targets, error prevention (no swipe!), mental model
skill("ui-ux-pro-max")            // mobile-first patterns, bottom CTA patterns, keyboard handling, safe areas
```

The mobile page is the biggest UX improvement in this project (replacing Vaul drawer). The design skills help avoid common mobile pitfalls.

### TypeUI MCP

Use for generating:

- Mobile layout shell with safe area utilities
- Bottom CTA bar pattern with `safe-pb` class
- Collapsible summary bar component
- Step transition animations (CSS keyframes)
- Form layout with proper keyboard handling

### Parallel Execution Strategy

Phase 3 is mostly a single-file change (`book.tsx`) plus one small helper component:

1. **One background task** for the mobile summary bar:
   ```
   task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-booking-summary-bar.tsx — compact collapsible mobile summary bar. Shows current selections (service, staff, time, price) in a single horizontal strip. Collapsible on tap to show full breakdown. Props same as BookingSummary. Uses Tailwind, safe-pb/pan-areas, lucide-react ChevronDown for expand indicator.")
   ```
2. **Orchestrator** rewrites `book.tsx` — remove BottomSheet branch, inject full-page mobile layout, add keyboard handling, add step transitions
3. After the mobile page is wired, review and refine animations

### Execution Workflow

1. Load design skills with `skill()` calls — critical for mobile UX decisions
2. Dispatch mobile summary bar as background task
3. Orchestrator rewrites `book.tsx` mobile branch:
   - Remove BottomSheet wrapper
   - Inject full-page layout with compact header, back button, step counter, progress bar
   - Add collapsible summary bar (import from background task)
   - Add fixed bottom CTA with safe area padding
   - Add keyboard-aware positioning for step 4
   - Add step transition animations (respecting prefers-reduced-motion)
4. Remove unused BottomSheet import from `book.tsx`
5. Run `bun run build`
6. Test extensively on mobile viewport (375px), especially iOS Safari keyboard behavior

# Top 5 Mobile Booking Fixes

These are the 5 most impactful issues to fix in priority order. Each fix is independent and can be run in a separate chat.

---

## Fix 1: Mobile Keyboard Obscuring Form Inputs (Critical)

**Files:** `src/routes/book/-step-confirm.tsx`, `src/routes/book.tsx`

**Problem:** On step 4, `useEffect` in `book.tsx:90-96` autofocuses the name input, triggering the mobile keyboard. The fixed sticky bottom bar and page content don't account for the iOS viewport shrink, so the name/phone/email inputs and the Pay Deposit button are likely covered by the keyboard. User can't see what they're typing or reach the CTA.

**Fix A — Remove mobile autofocus (in `book.tsx`):**
```tsx
// book.tsx lines 90-96 — replace the autofocus effect:
useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Only focus on desktop — mobile keyboard would block the view
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  if (!isMobile) {
    const el = stepRef.current?.querySelector<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  }
}, [step]);
```

**Fix B — Add keyboard-aware layout (in `-step-confirm.tsx`):**
Add `scroll-margin-bottom` to the submit button and wrap the form in a container that uses the `visualViewport` API:

```tsx
// Near the top of StepConfirm, add:
useEffect(() => {
  const handleResize = () => {
    const vv = window.visualViewport;
    if (vv) {
      document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
    }
  };
  window.visualViewport?.addEventListener('resize', handleResize);
  return () => window.visualViewport?.removeEventListener('resize', handleResize);
}, []);
```

Then on the form container wrapper, add a style that references it.
(The simpler approach is Fix A alone — it solves the main issue.)

---

## Fix 2: Step Progress Bar Overflows on Narrow Mobile (Critical)

**File:** `src/routes/book/-booking-step-progress.tsx`

**Problem:** The 4-step indicator needs ~336px horizontally (4 circles @ 36px + 3 connectors @ 48px + margins) but an iPhone SE (320px viewport - 24px padding) provides only 272px. The `w-12` (48px) connector bars cause ~64px overflow, clipping the rightmost step circle and label off-screen.

**Fix — Responsive connector width + circle size:**

```tsx
// Line 24 — change the connector width:
// BEFORE:
className={`h-0.5 w-12 mx-2 rounded-full ${...}`}
// AFTER:
className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 rounded-full ${...}`}
```

Optionally also shrink the step circles on mobile (line 36, 45, 54):
```tsx
// BEFORE:
className="w-9 h-9 rounded-full ..."
// AFTER:
className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ..."
```

**Alternative** (if you prefer scroll over shrink): Wrap the nav container in `overflow-x-auto` + `scrollbar-hidden`:
```tsx
// Line 13 — change the flex container:
<nav role="navigation" aria-label="Booking progress">
  <div className="flex items-center justify-center overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
```

---

## Fix 3: Booking Summary Hidden on Mobile — No Persistent Context (High)

**Files:** `src/routes/book.tsx`, `src/routes/book/-booking-summary.tsx`

**Problem:** `BookingSummary` is wrapped in `hidden md:block` (line 268). Mobile users navigate 3 selection steps with zero persistent feedback about what they've chosen. They must remember across steps or navigate back. This violates Nielsen's Recognition Over Recall heuristic and forces cognitive load.

**Fix — Add a compact mobile summary bar below step progress:**

Create a new mobile summary component or modify the existing flow. The simplest approach: show a compact horizontal chip bar in the booking page itself.

In `src/routes/book.tsx`, after the step progress section (around line 163), add:

```tsx
{/* Mobile booking summary chips — visible below md */}
<div className="md:hidden -mt-4 mb-4">
  {(service || tech || slot) && (
    <div className="flex flex-wrap gap-2">
      {service && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
          <span className="text-muted-foreground">Service:</span> {service.name}
        </span>
      )}
      {tech && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
          <span className="text-muted-foreground">Artist:</span> {tech.name}
        </span>
      )}
      {slot && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
          <span className="text-muted-foreground">When:</span> {fmtDate(slot)}, {fmtTime(slot)}
        </span>
      )}
    </div>
  )}
</div>
```

You'll need to thread `fmtTime` and `fmtDate` up to the Book component scope (they're currently only passed to StepConfirm and BookingSummary). The `BUSINESS` helpers are in `@/lib/salon` — import `fmtTime, fmtDate` at the top of `book.tsx`.

---

## Fix 4: Primary Submit Button Missing from Mobile Sticky Bar on Step 4 (High)

**Files:** `src/routes/book.tsx`

**Problem:** Steps 1-3 have the "Continue" CTA in the fixed bottom sticky bar. On step 4, the sticky bar shows only a back arrow (step < 4 is false, so the CTA is omitted entirely). The "Pay deposit" submit button is inline in the scrollable form — users must scroll past the summary card, 3 inputs, and mock payment card to find it. The sticky bar sits nearly empty with a single back icon, wasting prime thumb-reachable real estate.

**Fix — Add a submit button to the sticky bar on step 4:**

In `src/routes/book.tsx`, modify the mobile sticky bar section (lines 284-307):

```tsx
{/* Mobile sticky bottom bar */}
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl px-4 py-3 safe-pb sm:hidden">
  <div className="flex items-center gap-3">
    {step > 1 && (
      <button
        onClick={back}
        aria-label="Go back"
        className="tap-target flex items-center justify-center rounded-full border border-border px-4 py-3"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    )}
    {step < 4 ? (
      <button
        disabled={
          (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
        }
        onClick={next}
        className="flex-1 tap-target rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition"
      >
        Continue
      </button>
    ) : (
      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="flex-1 tap-target rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Booking…
          </span>
        ) : (
          `Pay ${fmtMoney(Number(service?.deposit_amount ?? 0))} deposit`
        )}
      </button>
    )}
  </div>
</div>
```

This requires exposing `canSubmit`, `isPending`, `onSubmit`, and the deposit amount to the sticky bar scope. You'll need to extract the `canSubmit` logic (currently in `StepConfirm` line 55-61) up to the `Book` component, or move the submit button rendering to where it has access to those values. The cleanest approach: compute `canSubmit` and `onSubmit` in `Book` and pass them down, then the sticky bar and inline button both reference the same state.

Also remove duplicate `onSubmit` from `StepConfirm`'s inline button if it's redundant, or keep both and have inline one hidden on mobile.

---

## Fix 5: Step Progress Labels at 10px Illegible on Mobile + Phone Input Lacks Validation (High)

### 5a — Tiny step labels

**File:** `src/routes/book/-booking-step-progress.tsx`

**Problem:** Labels render at `text-[10px]` on mobile — custom arbitrary value, well below legibility threshold. Combined with `text-muted-foreground`, they're nearly invisible as wayfinding.

**Fix:**
```tsx
// Line 60 — change:
className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${...}`}
// TO:
className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${...}`}
```

Or better, switch to responsive with a higher base:
```tsx
className={`text-xs font-medium whitespace-nowrap ${...}`}
```

Also remove the fragile `label.split(" ")[0]` abbreviation (line 65) and use explicit mobile labels:

```tsx
// At the top, add mobile labels:
const LABELS = ["Service", "Artist", "Date & Time", "Confirm"];
const MOBILE_LABELS = ["Service", "Artist", "Date/Time", "Confirm"];

// Lines 63-66 — replace:
<span className="hidden sm:inline">{label}</span>
<span className="sm:hidden">{label.split(" ")[0]}</span>
// WITH:
<span className="hidden sm:inline">{label}</span>
<span className="sm:hidden">{MOBILE_LABELS[i]}</span>
```

### 5b — Phone input lacks validation

**File:** `src/routes/book/-step-confirm.tsx`

**Problem:** `canSubmit` only checks `phone.trim().length > 0` (line 58). Users can type "abc" and proceed. Server rejects with a regex, but only surfaces as a toast after a full network round-trip.

**Fix — Add client-side phone regex validation:**

```tsx
// After the phone field declarations (around line 114-128), add:
const PHONE_RE = /^[\d\s\-()]{7,20}$/;
const showPhoneFormatError = touched.phone && phone.trim().length > 0 && !PHONE_RE.test(phone.trim());

// Update canSubmit (line 55-61):
const canSubmit =
  !isPending &&
  name.trim().length > 0 &&
  phone.trim().length > 0 &&
  PHONE_RE.test(phone.trim()) &&
  slot != null &&
  service != null &&
  staff != null;

// Add the format error message after the existing phone error (after line 128):
{showPhoneFormatError && (
  <p className="mt-1 text-xs text-amber-600">
    Enter a valid phone number (e.g., (815) 555-0123)
  </p>
)}
```

Also add a persistent format hint below the phone input that doesn't disappear when typing:
```tsx
{/* After the phone input error messages */}
<p className="mt-1 text-[11px] text-muted-foreground">
  Format: (555) 123-4567
</p>
```

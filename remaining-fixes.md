# Remaining Mobile Booking Fixes

> **STATUS (spot-verified in code, 2026-07-07):** Much of this backlog is already **IMPLEMENTED on main**:
> H1 ✅ loading states · H2 ✅ stale-slot clearing · H5 ✅ auto-advance removed (Option A) ·
> M4 ✅ beforeunload guard · M7 ✅ ARIA validation attributes · L5 ✅ dead desktop-layout file deleted.
> H3, H4, M1–M3, M5, M6, M8, and the remaining L items were NOT individually re-verified —
> re-audit against the code before working any of them. Some snippets reference pre-pivot
> deposit language.

All fixes not in the top-5 priority list, organized by severity. Each is independent and can be run in a separate chat.

---

## HIGH SEVERITY

---

### H1 — Loading States: False Empty States Before Data Arrives

**Files:** `src/routes/book.tsx`, `src/routes/book/-step-service.tsx`, `src/routes/book/-step-staff.tsx`

**Problem:** `data: services = []` and `data: staff = []` default to empty arrays. The `services === null` loading check in `StepService` is unreachable (it's `[]`, not `null`). Staff has no loading check at all. On slow mobile connections, users see "No services/artists available right now." before data loads, which can cause abandonment.

**Fix in `src/routes/book.tsx`:**

```tsx
// Line 48-57 — change to expose isFetching:
const { data: services = [], isFetching: servicesLoading } = useQuery({
  queryKey: ["services", salon?.id],
  queryFn: () => fetchServices(salon!.id),
  enabled: !!salon,
});
const { data: staff = [], isFetching: staffLoading } = useQuery({
  queryKey: ["staff", salon?.id],
  queryFn: () => fetchStaff(salon!.id),
  enabled: !!salon,
});
```

Then in the Book component render, pass `isFetching` to the step components:

```tsx
{
  step === 1 && (
    <StepService
      services={services}
      selectedId={serviceId}
      onSelect={(id) => {
        setServiceId(id);
        next();
      }}
      isLoading={servicesLoading} // NEW
    />
  );
}
{
  step === 2 && (
    <StepStaff
      staff={staff}
      selectedId={staffId}
      onSelect={(id) => {
        setStaffId(id);
        next();
      }}
      isLoading={staffLoading} // NEW
    />
  );
}
```

**Fix in `src/routes/book/-step-service.tsx`:**

Add the new prop:

```tsx
export interface StepServiceProps {
  services: Service[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean; // NEW
}
```

Replace the existing loading check (the unreachable `services === null`):

```tsx
// Lines 18-27 — replace:
if (services === null || isLoading) {
  return (
    <div className="grid place-items-center py-10">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-sm text-muted-foreground">Loading services…</span>
      </div>
    </div>
  );
}
```

**Fix in `src/routes/book/-step-staff.tsx`:**

Add the `isLoading` prop similarly:

```tsx
export interface StepStaffProps {
  staff: StaffMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean; // NEW
}
```

Add a loading state before the empty state:

```tsx
// Lines 16-24 — modify:
if (isLoading) {
  return (
    <div className="grid place-items-center py-10">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-sm text-muted-foreground">Loading artists…</span>
      </div>
    </div>
  );
}

if (staff.length === 0) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      No artists available right now.
    </div>
  );
}
```

---

### H2 — Stale Slot State Persists When Changing Service/Staff

**File:** `src/routes/book.tsx`

**Problem:** Changing `serviceId` or `staffId` via step-back or progress-bar jump doesn't clear `slot` state. A stale slot from a different staff/service combo persists, and Continue enables even though the slot is invalid. Server-side conflict catches it, but user experiences a confusing rejection.

**Fix — Clear slot when service/staff changes:**

```tsx
// Lines 178-181 — modify the service onSelect:
onSelect={(id) => {
  setServiceId(id);
  setSlot(null);         // NEW — clear stale slot
  setDate(new Date());    // OPTIONAL — reset to today
  next();
}}

// Lines 188-191 — modify the staff onSelect:
onSelect={(id) => {
  setStaffId(id);
  setSlot(null);         // NEW — clear stale slot
  setDate(new Date());    // OPTIONAL — reset to today
  next();
}}
```

Also fix progress-bar jumps (around line 162 `onStepClick`). The `setStep` callback in `BookingStepProgress` should clear downstream state:

```tsx
// Around line 162 — replace:
<BookingStepProgress step={step} onStepClick={(s: number) => setStep(s as Step)} />
// WITH:
<BookingStepProgress
  step={step}
  onStepClick={(s: number) => {
    setStep(s as Step);
    if (s < step) {
      // Jumping backwards — clear downstream state
      if (s <= 3) setSlot(null);
      if (s <= 2) { setStaffId(null); setSlot(null); }
      if (s <= 1) { setServiceId(null); setStaffId(null); setSlot(null); }
    }
  }}
/>
```

---

### H3 — Selected Items Use Only a Subtle Ring — Insufficient Visual Feedback

**Files:** `src/routes/book/-step-service.tsx`, `src/routes/book/-step-staff.tsx`

**Problem:** Selected service/staff cards distinguished solely by `ring-2 ring-ring` (2px border). No background tint, no shadow, no checkmark icon. On mobile outdoors/bright light, the ring is easily missed during scrolling.

**Fix in `-step-service.tsx` (line 48-49):**

```tsx
// Add a check icon and background tint to selected state:
className={`flex w-full tap-target items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-left active:scale-[0.98] transition ${
  isSelected
    ? "ring-2 ring-ring bg-primary/5 shadow-sm"
    : "hover:bg-surface-2"
}`}
```

Add a `Check` icon when selected (after the price span on line 60):

```tsx
{
  isSelected && (
    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}
```

Import `Check` at the top:

```tsx
import { Check } from "lucide-react";
```

**Fix in `-step-staff.tsx` (line 35):**

Similarly, add background tint and hover:

```tsx
className={`flex w-full tap-target items-center gap-4 rounded-2xl bg-surface p-4 text-left ${
  isSelected
    ? "ring-2 ring-ring bg-primary/5 shadow-sm"
    : "hover:bg-surface-2"
}`}
```

Add a `Check` badge overlay on selected state, positioned over the avatar or to the right.

---

### H4 — Silent Disabled Buttons with No Explanation (High)

**Files:** `src/routes/book.tsx`, `src/routes/book/-step-confirm.tsx`

**Problem:** Continue (steps 1-3) and Pay (step 4) buttons are disabled when prerequisites aren't met. Tapping produces zero feedback — no toast, no shake, no hint text. User doesn't know why they can't proceed.

**Fix — Add tap feedback on disabled buttons:**

In `src/routes/book.tsx`, add a toast or inline message when user taps a disabled button:

```tsx
// Add a state for disabled-button hints:
const [disabledHint, setDisabledHint] = useState<string | null>(null);

// Add a click handler for disabled buttons:
const handleDisabledClick = (step: number) => {
  const hints: Record<number, string> = {
    1: "Please select a service to continue",
    2: "Please choose an artist to continue",
    3: "Please pick a date and time to continue",
  };
  const hint = hints[step];
  if (hint) {
    setDisabledHint(hint);
    setTimeout(() => setDisabledHint(null), 3000);
  }
};
```

Then on each disabled button, add `onClick`:

```tsx
<button
  disabled={...}
  onClick={() => handleDisabledClick(step)}
  ...
>
```

And render the hint:

```tsx
{
  disabledHint && (
    <p className="text-xs text-amber-600 text-center mt-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {disabledHint}
    </p>
  );
}
```

---

### H5 — Step Auto-Advance on Selection Without Undo

**File:** `src/routes/book.tsx`

**Problem:** Selecting a service immediately jumps to step 2; selecting staff jumps to step 3. On mobile, fat-finger mis-taps are common, and the user is instantly pushed forward with no undo short of Back. This also compounds the stale-slot issue.

**Fix — Decouple selection from navigation OR add undo toast:**

**Option A (Decouple — simpler, recommended):**

```tsx
// Change onSelect to NOT call next():
onSelect={(id) => {
  setServiceId(id);
  setSlot(null);
  // Don't call next() — user taps Continue explicitly
}}
```

The Continue button checks if a selection is made:

```tsx
// Continue button disabled state already works:
disabled={(step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)}
```

**Option B (Undo toast — if you want to keep auto-advance):**

```tsx
// In Book component, add undo state:
const [lastAction, setLastAction] = useState<{ type: 'service' | 'staff'; id: string } | null>(null);
const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

// When selecting:
onSelect={(id) => {
  if (undoTimeout) clearTimeout(undoTimeout);
  setServiceId(id);
  setSlot(null);
  const action = { type: 'service' as const, id };
  setLastAction(action);
  // Show undo toast, then advance after delay
  toast("Selected this service", {
    action: { label: "Undo", onClick: () => {
      setServiceId(null);
      setLastAction(null);
    }},
    duration: 3000,
  });
  const t = setTimeout(() => { next(); setLastAction(null); }, 800);
  setUndoTimeout(t);
}}
```

---

## MEDIUM SEVERITY

---

### M1 — Date Scroller Buttons Lack tap-target and Use 10px Text

**File:** `src/routes/book/-step-datetime.tsx`

**Problem:** Date buttons don't use `tap-target` utility. Weekday labels render at `text-[10px]`. 14 chips tightly packed on small screens.

**Fix:**

```tsx
// Line 36 — add tap-target:
className={`shrink-0 tap-target flex flex-col items-center justify-center rounded-2xl px-4 py-3 ${selected ? "bg-primary text-primary-foreground" : "bg-surface"}`}

// Line 38 — bump text size:
<span className="text-[11px] sm:text-xs uppercase tracking-wider">
```

Optionally reduce from 14 to 7 days on mobile with a "Show more" button, but the simpler fix is just `tap-target` and larger text.

---

### M2 — Mobile Back Button is Icon-Only With No Text Label

**File:** `src/routes/book.tsx`

**Problem:** Back button (line 286-293) shows only `ChevronLeft` icon. Desktop shows "Back" + icon. Ambiguous on step 4 where it's the sole element.

**Fix:**

```tsx
// Line 286-293 — add text:
<button
  onClick={back}
  aria-label="Go back"
  className="tap-target inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-3"
>
  <ChevronLeft className="h-5 w-5" />
  <span className="text-sm font-medium">Back</span>
</button>
```

---

### M3 — Step Label Truncation via `.split(" ")[0]` Loses Meaning

**File:** `src/routes/book/-booking-step-progress.tsx`

**Problem:** `label.split(" ")[0]` turns "Date & Time" into "Date" — dropping the "Time" aspect entirely. Fragile heuristic.

**Fix — Use explicit short labels:**

```tsx
// At module level:
const LABELS = ["Service", "Artist", "Date & Time", "Confirm"];
const MOBILE_LABELS = ["Service", "Artist", "Date/Time", "Confirm"];

// Lines 63-66 — replace:
<span className="hidden sm:inline">{label}</span>
<span className="sm:hidden">{label.split(" ")[0]}</span>
// WITH:
<span className="hidden sm:inline">{LABELS[i]}</span>
<span className="sm:hidden">{MOBILE_LABELS[i]}</span>
```

---

### M4 — No Unsaved Progress Warning on Navigation/Browser Close

**File:** `src/routes/book.tsx`

**Problem:** All step selections lost on accidental close/back-navigation. No `beforeunload`, no route guard.

**Fix — Add `beforeunload` + `sessionStorage` persistence:**

```tsx
// In Book component, add:
const hasSelection = step > 1 || serviceId || staffId || slot || name || phone;

useEffect(() => {
  if (!hasSelection) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [hasSelection]);
```

For `sessionStorage` backup, add save/restore:

```tsx
const BOOKING_STATE_KEY = "booking-state";

// Save on change:
useEffect(() => {
  if (serviceId || staffId || slot || name || phone) {
    sessionStorage.setItem(
      BOOKING_STATE_KEY,
      JSON.stringify({
        serviceId,
        staffId,
        date: date.toISOString(),
        slot: slot?.toISOString(),
        name,
        phone,
        email,
        step,
      }),
    );
  }
}, [serviceId, staffId, date, slot, name, phone, email, step]);
```

---

### M5 — No Debounce on Slot Query for Rapid Date Changes

**File:** `src/routes/book.tsx`

**Problem:** Each date change fires a separate Supabase RPC call immediately. Previous requests aren't cancelled. On slow connections this causes queue buildup.

**Fix — Debounce date changes:**

```tsx
// Add useRef for debounce:
const dateDebounceRef = useRef<ReturnType<typeof setTimeout>>();

// Create a debounced setter:
const handleDateChange = (d: Date) => {
  if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
  dateDebounceRef.current = setTimeout(() => {
    setDate(d);
    setSlot(null);
  }, 300);
};
```

Replace the existing `onDateChange` prop usage with `handleDateChange`.

Also set a `staleTime` on the slot query (line 113):

```tsx
const { data: slots = [], isFetching: loadingSlots } = useQuery({
  queryKey: ["slots", staffId, serviceId, date.toDateString()],
  enabled: !!salon && !!service && !!tech,
  staleTime: 60_000, // NEW — cache results for 1 minute
  queryFn: () => ...
});
```

---

### M6 — Step Transitions Are Instant With No Animation

**File:** `src/routes/book.tsx`

**Problem:** Content area swaps instantly on step change — no fade/slide. The user is teleported between steps.

**Fix — Add CSS fade-in:**

In the step content container (around line 169-240), wrap each step in a transition div:

```tsx
// Wrap each step in an animated container:
<div key={step} className="animate-in fade-in duration-200">
  {step === 1 && (<StepService ... />)}
  {step === 2 && (<StepStaff ... />)}
  {step === 3 && (<StepDateTime ... />)}
  {step === 4 && (<StepConfirm ... />)}
</div>
```

The `animate-in` and `fade-in` classes come from `tw-animate-css` (already imported in `styles.css` line 3). If they don't exist, add this to `styles.css`:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeIn 200ms ease-out;
}
```

---

### M7 — Validation Errors Not Announced to Screen Readers

**File:** `src/routes/book/-step-confirm.tsx`

**Problem:** Error `<p>` elements (lines 111, 128) have no `role="alert"`, no `aria-describedby` on inputs, no `aria-invalid`.

**Fix — Add ARIA attributes to validation:**

```tsx
// Name input — line 97-111:
<label className="block">
  <span className="text-xs font-medium text-muted-foreground">Full name</span>
  <input
    ...
    aria-invalid={showNameError || undefined}
    aria-describedby={showNameError ? "name-error" : undefined}
    className={`mt-1 w-full tap-target rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
      showNameError ? "ring-2 ring-destructive" : ""
    }`}
  />
  {showNameError && (
    <p id="name-error" role="alert" className="mt-1 text-xs text-red-500">
      Please enter your name
    </p>
  )}
</label>
```

Apply the same pattern to the phone field (lines 114-128):

- Add `id="phone-error"` and `role="alert"` to the error paragraph
- Add `aria-describedby="phone-error"` to the input
- Add `aria-invalid={showPhoneError || undefined}` to the input

Also update the email field with `aria-describedby` for the persistent hint.

---

### M8 — Inconsistent Active Press State Between Service and Staff Cards

**Files:** `src/routes/book/-step-service.tsx`, `src/routes/book/-step-staff.tsx`

**Problem:** Service buttons have `active:scale-[0.99]` (imperceptibly weak). Staff buttons have no press state at all. The `0.99` scale is a ~0.3px difference — invisible.

**Fix — Add consistent, perceptible press effects:**

```tsx
// In -step-service.tsx line 48 — change:
active:scale-[0.99]
// TO:
active:scale-[0.98] transition-transform duration-75

// Make the transition smoother:
transition-all duration-200
```

```tsx
// In -step-staff.tsx line 35 — add press effect:
className={`flex w-full tap-target items-center gap-4 rounded-2xl bg-surface p-4 text-left active:scale-[0.98] transition-transform duration-75 ${
  isSelected ? "ring-2 ring-ring" : ""
}`}
```

Also add a hover state for desktop:

```tsx
// Add to both:
hover: bg - surface - 2;
```

---

## LOW SEVERITY

---

### L1 — Hero Section Consumes 150-180px Viewport on Mobile

**File:** `src/routes/book.tsx`

**Problem:** Hero renders identically on all 4 steps. On 667px iPhone SE, it takes ~25% of screen. On step 4, users have seen it 3 times already.

**Fix — Collapse hero on steps 2+ on mobile:**

```tsx
// Around line 148-158:
<section className={`border-b border-border/60 ${step > 1 ? "sm:block" : ""}`}>
  <div
    className={`mx-auto max-w-3xl px-6 text-center ${
      step > 1 ? "py-4 sm:py-16" : "py-16 sm:py-20"
    }`}
  >
    {step === 1 ? (
      <>
        <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Booking</p>
        <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-5xl">
          Reserve your <span className="italic">seat.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Four short steps — service, artist, time, details.
        </p>
      </>
    ) : (
      <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Step {step} of 4</p>
    )}
  </div>
</section>
```

---

### L2 — No "Today" Indicator in Date Scroller for Orientation

**File:** `src/routes/book/-step-datetime.tsx`

**Problem:** Once user scrolls past today to a different date, no visual anchor shows which is "today."

**Fix — Add subtle "Today" marker:**

```tsx
// Inside the date button, after the day number:
<button ...>
  <span className="text-[11px] sm:text-xs uppercase tracking-wider">
    {d.toLocaleDateString("en-US", { weekday: "short" })}
  </span>
  <span className="mt-0.5 text-lg font-bold">{d.getDate()}</span>
  {/* NEW: Today indicator */}
  {d.toDateString() === new Date().toDateString() && !selected && (
    <span className="text-[9px] uppercase tracking-wider text-accent mt-0.5">Today</span>
  )}
</button>
```

---

### L3 — Placeholder Text Disappears on Input Entry — Format Hints Lost

**File:** `src/routes/book/-step-confirm.tsx`

**Problem:** `(815) 555-0123` placeholder vanishes on typing. User may forget the expected format after switching fields.

**Fix — Add persistent helper text below each input:**

```tsx
// After the phone input group (after line 128):
<p className="mt-1 text-[11px] text-muted-foreground">US number: (555) 123-4567</p>
```

---

### L4 — Muted-foreground Contrast Likely Below WCAG AA

**File:** `src/styles.css`

**Problem:** `--muted-foreground: oklch(0.48 0.03 350)` on `--background: oklch(0.985 0.008 60)` yields ~4.0:1 contrast ratio — below the 4.5:1 AA threshold for <18px text. Affects all body copy, labels, metadata.

**Fix — Darken muted-foreground slightly:**

```css
/* Line 74 in styles.css — change: */
--muted-foreground: oklch(0.48 0.03 350);
/* TO: */
--muted-foreground: oklch(0.4 0.03 350);
```

Also verify the dark mode equivalent (line 113):

```css
/* Line 113 — ensure it's adequate: */
--muted-foreground: oklch(0.65 0 0);
```

This may need to be lightened on dark mode for visibility.

---

### L5 — Dead Code: `-booking-layout-desktop.tsx` Never Imported

**File:** `src/routes/book/-booking-layout-desktop.tsx`

**Problem:** `BookingLayoutDesktop` component is defined but never imported anywhere. The layout is inlined in `book.tsx`.

**Fix — Either refactor to use it or delete the file:**

**Option A (Delete — simpler):**

```bash
rm src/routes/book/-booking-layout-desktop.tsx
```

**Option B (Refactor — if you want the pattern):**
Import and use it in `book.tsx`:

```tsx
import BookingLayoutDesktop from "./book/-booking-layout-desktop";
```

Then wrap the `book.tsx` layout in it instead of the inline layout.

---

### L6 — Slot Loading Shows Bare Spinner Instead of Skeleton Grid

**File:** `src/routes/book/-step-datetime.tsx`

**Problem:** Single centered `Loader2` spinner replaces the 2-column slot grid on load. Layout shift on transition.

**Fix — Replace spinner with skeleton placeholders:**

```tsx
// Lines 49-52 — replace:
{
  loadingSlots ? (
    <div className="grid place-items-center py-10">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ) : null;
}
// WITH:
{
  loadingSlots ? (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-surface animate-pulse" aria-hidden="true" />
      ))}
    </div>
  ) : null;
}
```

---

### L7 — "Mock Payment" Copy Creates Confusion About Real Charges

**File:** `src/routes/book/-step-confirm.tsx`

**Problem:** "Mock payment — demo only" and "Tap card on file •••• 4242" is developer jargon. Users can't tell if they're being charged.

**Fix — Replace with honest, clear copy:**

```tsx
// Lines 149-157 — replace:
{
  /* Payment Section */
}
<div className="rounded-2xl bg-surface p-4">
  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
    <Check className="h-3 w-3 text-success" />
    No payment required to book
  </div>
  <p className="mt-2 text-sm">
    Pay at the salon after your service. We'll send a reminder before your appointment.
  </p>
</div>;
```

---

### L8 — Required Fields Not Visually Indicated

**File:** `src/routes/book/-step-confirm.tsx`

**Problem:** Email is labeled "Email (optional)" but name and phone have no "(required)" suffix or asterisk. Users discover via trial-and-error.

**Fix:**

```tsx
// Line 98 — change:
<span className="text-xs font-medium text-muted-foreground">Full name</span>
// TO:
<span className="text-xs font-medium text-muted-foreground">Full name <span className="text-red-500">*</span></span>

// Line 115 — similar:
<span className="text-xs font-medium text-muted-foreground">Phone <span className="text-red-500">*</span></span>
```

---

### L9 — "Visit" Header Link Uses Hash Navigation With Unclear Destination

**File:** `src/components/site-chrome.tsx`

**Problem:** The "Visit" nav link navigates to `to='/' hash='visit'` — scrolls home page to visit section. Users on booking page may not expect this behavior.

**Fix:**

```tsx
// Line 34 — rename for clarity or change behavior:
<Link to="/" hash="visit" className="hover:text-foreground transition">
  Visit
</Link>
// OPTION A: Change label:
<Link to="/" hash="visit" className="hover:text-foreground transition">
  Location & Hours
</Link>
// OPTION B: Navigate to dedicated page:
<Link to="/" hash="visit" className="hover:text-foreground transition">
  Visit Us
</Link>
```

---

### L10 — aria-live Region May Not Reliably Announce on Step Change

**File:** `src/routes/book.tsx`

**Problem:** The `aria-live="polite"` region (line 170) is inside the step content container. If the container re-renders and removes/re-adds the DOM node, screen readers may miss the announcement.

**Fix — Move the `aria-live` region outside the step content:**

```tsx
// Move from line 170 (inside the step content div) to outside, e.g.:
<div className="md:col-span-8" ref={stepRef}>
  {/* REMOVED from here */}
  ...
</div>

// Add it just before the step content div:
<div aria-live="polite" className="sr-only" aria-atomic="true">
  {announcement}
</div>
```

---

### L11 — Small Muted Text at 11-12px May Fail WCAG AA Contrast

**Files:** `src/routes/book/-step-service.tsx`, `src/routes/book/-step-staff.tsx`

**Problem:** Category labels ("Nail · 45 min"), duration text, and staff titles use `text-xs` with `text-muted-foreground`. At 12px and below, WCAG AA requires 4.5:1 minimum.

**Fix — Increase to `text-sm` or verify contrast:**

```tsx
// In -step-service.tsx line 54:
<p className="mt-0.5 text-xs text-muted-foreground">
// Change to:
<p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">

// In -step-staff.tsx line 46:
<p className="text-xs text-muted-foreground capitalize">
// Change to:
<p className="text-xs sm:text-sm text-muted-foreground capitalize">
```

After addressing L4 (darkening `--muted-foreground`), these may pass contrast at `text-xs`.

# NL Repo UI Migration Guide

> **Purpose:** Port superior UI/UX patterns from the NL reference repo (`/tmp/nl-audit/`) into nail-lounge-mp.
> **Stack:** TanStack Start (React 19) + Tailwind v4 + shadcn/ui + real Supabase
> **Target NL Repo:** `/tmp/nl-audit/` (React 18 + Vite + mock data — design reference only)
> **Migration Type:** UI/UX only — no backend schema changes required for most items. "No Preference" flagged separately.
> **Priority:** Items ordered by impact + risk. Implement from top to bottom.

---

## Table of Contents

1. [Change Inventory](#1-change-inventory)
2. [Implementation Order](#2-implementation-order)
3. [Detailed Instructions per Item](#3-detailed-instructions-per-item)
   - 3.01 — Home Page: Add WaveDivider sections
   - 3.02 — Home Page: Restyle services grid
   - 3.03 — Gallery: Masonry layout + lightbox
   - 3.04 — Booking Step-Confirm: shadcn Card + Row pattern
   - 3.05 — Booking Step-Confirm: react-hook-form + Card summary
   - 3.06 — Booking-Confirmed: Confetti
   - 3.07 — Booking: "No Preference" staff option
   - 3.08 — Booking: Grid-style time slots
   - 3.09 — Booking: Grouped service cards (Step 1)
   - 3.10 — Booking-CTA: Reusable component
   - 3.11 — 404 Page: Branded not-found
4. [Risk Register](#4-risk-register)
5. [Verification Steps](#5-verification-steps)

---

## 1. Change Inventory

| #   | Item                                      | Area    | Risk        | NL File (Reference)             | Current File                                                       |
| --- | ----------------------------------------- | ------- | ----------- | ------------------------------- | ------------------------------------------------------------------ |
| 01  | WaveDivider sections on home page         | Home    | Low         | `home.tsx` (discussed patterns) | `src/routes/index.tsx` + `src/components/wave-divider.tsx`         |
| 02  | Services preview grid on home page        | Home    | Low         | `home.tsx` service cards        | `src/routes/index.tsx`                                             |
| 03  | Masonry gallery + Dialog lightbox         | Gallery | Low-Medium  | `gallery.tsx`                   | `src/routes/gallery.tsx`                                           |
| 04  | shadcn Card + Row pattern in step-confirm | Booking | Low         | `step-confirm.tsx`              | `src/routes/book/-step-confirm.tsx`                                |
| 05  | react-hook-form in confirm step           | Booking | Low         | `step-confirm.tsx`              | `src/routes/book/-step-confirm.tsx`                                |
| 06  | Confetti on booking-confirmed page        | Booking | Low         | `booking-confirmed.tsx`         | `src/routes/booking-confirmed.tsx`                                 |
| 07  | "No Preference" staff option              | Booking | Medium-High | `step-staff.tsx` + `booking.ts` | `src/routes/book/-step-staff.tsx` + `src/lib/booking.functions.ts` |
| 08  | Grid-style time slots (vs flex-col)       | Booking | Low         | `step-time.tsx`                 | `src/routes/book/-step-datetime.tsx`                               |
| 09  | Grouped service cards (category cards)    | Booking | Low         | `step-service.tsx`              | `src/routes/book/-step-service.tsx`                                |
| 10  | Reusable Booking-CTA component            | Shared  | Low         | `booking-cta.tsx`               | (inline in index.tsx)                                              |
| 11  | Branded 404 page                          | App     | Low         | (implied)                       | `src/routes/__root.tsx` NotFoundComponent                          |

---

## 2. Implementation Order

```
Phase 1 — Quick Wins (no data changes, high visual impact)
  01 → 02 → 10 → 11 → 06

Phase 2 — Booking Flow Improvements (UI only, touch booking wizard)
  09 → 08 → 04/05

Phase 3 — Gallery (new component, medium complexity)
  03

Phase 4 — "No Preference" (requires backend + careful testing)
  07
```

---

## 3. Detailed Instructions per Item

### 3.01 — Home Page: WaveDivider Sections

**Severity:** High (visual cohesion)
**Target file:** `src/routes/index.tsx`
**Reference:** NL home.tsx section transitions

**What to do:**
The component at `src/components/wave-divider.tsx` exists and is correct but is never imported. Add it between sections on the home page to create visual rhythm.

**The wave-divider component already exists:**

```tsx
// src/components/wave-divider.tsx — already written, do not modify
// It renders an inline SVG wave with brand colors
```

**Where to place on home page (`src/routes/index.tsx`):**
Between these sections (approximate line numbers):

- Hero → Services section (~line 100, after `</section>` closing hero)
- Services → Hours/map section (~line 180)
- Hours/map → CTA section (~line 230)

**Placement pattern (use for each insertion):**

```tsx
import WaveDivider from "~/components/wave-divider";

// Between sections, add:
<WaveDivider />;
```

**Verify:** `bun dev` — scroll home page, see wave transitions between each major section. Check mobile (should be full-width, no overflow).

---

### 3.02 — Home Page: Services Grid Preview

**Severity:** Medium (visual polish)
**Target file:** `src/routes/index.tsx`
**Reference:** NL home.tsx service card pattern

**What to do:**
Replace the current inline service list on the home page (currently likely text links or simple list) with styled service cards matching NL's pattern.

**NL pattern (from home.tsx):**
The NL home page shows services as cards within a `grid` with a heading for each category. The pattern uses:

- Category name as header
- Service cards showing name + brief description + price
- Hover lift effect (transition on transform/shadow)
- CTA link to full services page

**Implementation:**

```tsx
// After fetching services via const { data: services } = useQuery(...)
// Group by category:
const grouped = useMemo(() => {
  const map = new Map<string, typeof services>();
  for (const s of services ?? []) {
    const cat = s.category || "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(s);
  }
  return Array.from(map.entries());
}, [services]);

// Render:
{
  grouped.map(([category, items]) => (
    <div key={category} className="space-y-3">
      <h3 className="font-display text-2xl">{category}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((service) => (
          <div
            key={service.id}
            className="rounded-xl bg-surface p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium">{service.name}</h4>
                {service.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-semibold">${Number(service.price).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}
```

**Verify:** Home page shows service cards grouped by category, each with name, description, price. Hover effect works.

---

### 3.03 — Gallery: Masonry Layout + Lightbox

**Severity:** High (visual impact)
**Target file:** `src/routes/gallery.tsx`
**Reference:** NL `gallery.tsx`

**What to do:**
Replace the current static grid of images with:

1. CSS columns-based masonry layout (no extra JS library needed)
2. Radix Dialog-based lightbox with prev/next navigation and caption overlay

**NL gallery pattern (`/tmp/nl-audit/src/app/pages/gallery.tsx`):**

```tsx
// Key patterns:
// 1. Masonry using CSS columns
<div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
  {images.map((image, index) => (
    <button
      key={image.id}
      onClick={() => setSelectedIndex(index)}
      className="group relative mb-4 block w-full overflow-hidden rounded-xl"
    >
      <img
        src={image.src}
        alt={image.alt}
        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Caption overlay on hover */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="text-sm text-white">{image.caption}</p>
      </div>
    </button>
  ))}
</div>;

// 2. Radix Dialog lightbox
import * as Dialog from "@radix-ui/react-dialog";
// Or shadcn version:
import { Dialog, DialogContent, DialogClose } from "~/components/ui/dialog";

<Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
  <DialogContent className="max-w-4xl border-0 bg-transparent p-0">
    {selectedIndex !== null && (
      <div className="relative">
        <img
          src={images[selectedIndex].src}
          alt={images[selectedIndex].alt}
          className="max-h-[85vh] w-full rounded-lg object-contain"
        />
        {/* Caption */}
        {images[selectedIndex].caption && (
          <p className="mt-2 text-center text-sm text-white">{images[selectedIndex].caption}</p>
        )}
        {/* Prev/Next buttons */}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() =>
              setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))
            }
            className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() =>
              setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))
            }
            className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>;
```

**Key decisions:**

- Use `columns-1 sm:columns-2 lg:columns-3` for masonry (pure CSS, no library needed)
- Use shadcn `Dialog` component (already in project from `src/components/ui/dialog.tsx`)
- Keep existing Instagram/TikTok embed sections below gallery (they are content, not gallery)
- Allow image data to be inline static imports (as currently) or move to a gallery config file
- The lightbox should respect `prefers-reduced-motion: no-preference` for transitions

**Verify:** Gallery page shows masonry layout, click any image to open lightbox, navigate with prev/next or keyboard arrows, close with Escape.

---

### 3.04 — Booking Step-Confirm: shadcn Card + Row Pattern

**Severity:** Medium (design polish)
**Target file:** `src/routes/book/-step-confirm.tsx`
**Reference:** NL `step-confirm.tsx`

**What to do:**
Restyle the booking summary from a plain `bg-surface p-4` div to a proper shadcn `Card` with the Row pattern used in NL.

**NL Row pattern:**

```tsx
// Each line in the summary is a Row: icon + label + value
// The pattern is used in both step-confirm.tsx and booking-confirmed.tsx

// Row component (can be a local helper or inline):
const DetailRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex flex-1 items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  </div>
)

// Usage inside Card header:
<Card>
  <CardHeader>
    <CardTitle className="font-display text-xl">Confirm Your Booking</CardTitle>
    <CardDescription>Review your appointment details</CardDescription>
  </CardHeader>
  <CardContent>
    <DetailRow icon={Scissors} label="Service" value={serviceName} />
    <Separator />
    <DetailRow icon={User} label="Staff" value={staffName} />
    <Separator />
    <DetailRow icon={Calendar} label="Date & Time" value={formattedDateTime} />
    <Separator />
    <DetailRow icon={DollarSign} label="Price" value={`$${price}`} />
  </CardContent>
</Card>
```

**Current pattern to replace:**

```tsx
// Current (simplified):
<section className="space-y-4 rounded-xl bg-surface p-6">
  <h2 className="font-display text-xl">Confirm</h2>
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">Service</span>
      <span className="text-sm font-medium">{serviceName}</span>
    </div>
    ...
  </div>
</section>
```

**Imports needed:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Separator` (all from `~/components/ui/` — check they exist in the project).

**Verify:** Summary shows in a proper Card component with icon rows and separators.

---

### 3.05 — Booking Step-Confirm: react-hook-form

**Severity:** Medium (code quality)
**Target file:** `src/routes/book/-step-confirm.tsx`
**Reference:** NL `step-confirm.tsx`

**What to do:**
Replace the manual touched-state validation with `react-hook-form` + Zod schema, or integrate react-hook-form `Controller` around the existing fields (name, email, phone, notes).

**NL pattern:**

```tsx
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const confirmSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  notes: z.string().optional(),
})

type ConfirmForm = z.infer<typeof confirmSchema>

// Inside component:
const { control, handleSubmit, formState: { errors } } = useForm<ConfirmForm>({
  resolver: zodResolver(confirmSchema),
  defaultValues: {
    name: "",
    email: "",
    phone: "",
    notes: "",
  },
})

// For each field, use Controller:
<Controller
  control={control}
  name="name"
  render={({ field }) => (
    <div>
      <Input {...field} placeholder="Your Name" />
      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
    </div>
  )}
/>
```

**Note:** `react-hook-form` and `@hookform/resolvers` should already be in the project (per TECHNICAL_SPEC.md). Confirm before importing.

**Verify:** Form validates on submit, shows error messages inline, submit handler fires correctly.

---

### 3.06 — Booking-Confirmed: Confetti

**Severity:** Medium (user delight)
**Target file:** `src/routes/booking-confirmed.tsx`
**Reference:** NL `booking-confirmed.tsx`

**What to do:**
Add canvas-confetti on the booking confirmation page, triggered on mount with brand color palette. Respect `prefers-reduced-motion`.

**NL confetti pattern:**

```tsx
// At top of file:
import confetti from "canvas-confetti";

// Check if canvas-confetti is in package.json. If not: bun add canvas-confetti && bun add -d @types/canvas-confetti

// On component mount:
useEffect(() => {
  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#4e6f62", "#c9a24b", "#a9bfb6", "#ede7de"],
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#4e6f62", "#c9a24b", "#a9bfb6", "#ede7de"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}, []);
```

**Important:** NL uses brand hex codes directly. The current repo uses CSS variables. For best results, extract the actual brand CSS variable values:

```tsx
// Alternative: read CSS custom properties
const style = getComputedStyle(document.documentElement);
const primary = style.getPropertyValue("--color-primary").trim();
const accent = style.getPropertyValue("--color-accent").trim();
// Fallback to hex if CSS vars resolve to RGB:
const hexPrimary = primary.startsWith("#") ? primary : "#4e6f62";
```

But simpler: just use the brand colors inline. The confetti fires only once on mount.

**Verify:** After booking, confirmation page shows confetti burst from both corners. No confetti if `prefers-reduced-motion: reduce`.

---

### 3.07 — Booking: "No Preference" Staff Option

**Severity:** High (requires data layer change)
**Risk:** Medium-High — needs careful testing
**Target files:**

- `src/routes/book/-step-staff.tsx` (UI)
- `src/routes/book.tsx` (state management)
- `src/lib/booking.functions.ts` (backend — maybe)
- `src/lib/salon.ts` (data layer — maybe)

**Reference:** NL `step-staff.tsx`, `booking.ts` mock methods

**Design intent:**

- Staff selection step shows "No Preference" as the first/only option when there are multiple staff members for a service
- When "No Preference" is selected, all time slots from all eligible staff are shown merged
- At booking submission, the system auto-assigns the first available staff member for the chosen time slot

**Implementation approach (RECOMMENDED: Frontend-only — safest):**

1. **In `-step-staff.tsx`:**

```tsx
// Add "No Preference" as the first card when multiple staff available:
const showNoPreference = staff.length > 1

<>
  {showNoPreference && (
    <button
      onClick={() => onSelect("no-preference")}
      className={`rounded-xl p-4 text-center transition-all ${
        selectedStaffId === "no-preference"
          ? "bg-primary text-primary-foreground ring-2 ring-primary"
          : "bg-surface hover:shadow-md"
      }`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-6 w-6" />
      </div>
      <p className="mt-2 font-medium">No Preference</p>
      <p className="text-xs text-muted-foreground">Assign me to whoever's available</p>
    </button>
  )}
  {staff.map(s => (
    <button
      key={s.id}
      onClick={() => onSelect(s.id)}
      ...
    >
      {/* existing staff card */}
    </button>
  ))}
</>
```

2. **In `book.tsx` wizard state:**

```tsx
// When "no-preference" is the selected staff for step 3 (datetime),
// fetch available slots from ALL staff (skip the single-staff filter)
const allStaffIds = staff.map((s) => s.id);
const effectiveStaffIds = selectedStaffId === "no-preference" ? allStaffIds : [selectedStaffId];
```

3. **In `-step-datetime.tsx`:**
   When rendering time slots with "No Preference", show slots from all staff without revealing which staff member each slot belongs to (just show available times).

4. **On confirm/submit:**

```tsx
// Resolve "no-preference" to the first available staff at this time
// This happens in the client before calling createPublicBooking
const resolveStaffId = async (date: string, time: string, serviceId: string, allStaff: Staff[]) => {
  // Get available slots for ALL staff at this date
  // Pick the first staff member who has this slot available
  // This logic lives in book.tsx, not in the server function
};
```

**Alternative (if frontend-only is too complex):**
Extend `createPublicBooking` in `booking.functions.ts` to accept a `staffId: "no-preference"` sentinel and do the auto-assignment server-side. This requires changing the Zod schema and adding logic to pick available staff. Higher risk because it touches the server booking path.

**Per-file changes:**

**`src/routes/book/-step-staff.tsx`:**

- Import `Users` from lucide-react
- Add "No Preference" button as first option when `staff.length > 1`
- Pass `"no-preference"` string as the selected value (not a UUID)

**`src/routes/book.tsx`:**

- Add `isNoPreference` computed: `const isNoPreference = selectedStaffId === "no-preference"`
- In the step validations, treat `"no-preference"` as valid staff selection
- When computing available slots, include all staff if `isNoPreference`
- At submit time, resolve `"no-preference"` to actual staff UUID before calling `createPublicBooking`

**`src/routes/book/-step-datetime.tsx`:**

- Accept optional `noPreference` prop — when true, hide staff label from time slots (or show a generic "Available" label)

**`src/routes/book/-step-confirm.tsx`:**

- If staff is "no-preference", display "Auto-assigned" or similar

**`src/lib/salon.ts`:**

- May need to export a helper to check slot availability across all staff at a given time
- Or add a new RPC `get_available_slots_for_all_staff(date, serviceId, salonId)`

**`src/lib/booking.functions.ts`:**

- May need to accept `"no-preference"` or just leave it as-is (since we resolve on client)

**Testing:**

1. Select "No Preference" → should show slots from all staff (deduplicated)
2. Select a time slot → proceed to confirm
3. Submit → booking should be created with a valid staff UUID
4. Check DB: `bookings.staff_id` should be set to a real UUID

---

### 3.08 — Booking: Grid-Style Time Slots

**Severity:** Low-Medium (visual polish)
**Target file:** `src/routes/book/-step-datetime.tsx`
**Reference:** NL `step-time.tsx`

**What to do:**
Change time slot rendering from flex-col full-width buttons to a grid layout that shows more slots per row.

**Current pattern:**

```tsx
// Current: flex-col, each slot is full-width
<div className="space-y-2">
  {slots.map((slot) => (
    <button key={slot.time} className="w-full ...">
      {slot.time}
    </button>
  ))}
</div>
```

**NL grid pattern:**

```tsx
// Grid layout from step-time.tsx:
<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
  {slots.map((slot) => (
    <button
      key={slot.time}
      onClick={() => onSelect(slot.time)}
      disabled={slot.unavailable}
      className={`rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-all
        ${
          slot.unavailable
            ? "cursor-not-allowed opacity-40"
            : selectedTime === slot.time
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface text-foreground hover:shadow-md"
        }`}
    >
      {slot.time}
      {/* Only show "Next Opening" label when it's the first unavailable slot at the top */}
    </button>
  ))}
</div>
```

**"Next Opening" feature (from NL `step-time.tsx`):**
When scrolling into a date with no available slots, the first subsequent available slot should float with a label:

```tsx
// Detect the first unavailable slot and show "Next Opening" CTA
const firstUnavailable = slots.find((s) => s.unavailable);
const nextOpeningSlot = slots.find((s) => !s.unavailable && s > firstUnavailable);

// Render logic: if no slots are available at all, show a "Next Opening" card:
{
  slots.every((s) => s.unavailable) && (
    <div className="col-span-full rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/20">
      <p className="font-medium text-amber-800 dark:text-amber-200">Fully Booked</p>
      <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
        Next opening: {nextOpeningDate}
      </p>
    </div>
  );
}
```

**Implementation:**

- Replace the flex-col container with `grid grid-cols-3 gap-2 sm:grid-cols-4`
- Keep the existing 14-day date rail (it already looks similar to NL)
- Add the "Fully Booked" state for dates with no availability
- Keep existing loading/empty states

**Verify:** Time slots display in a 3-column (mobile) / 4-column (desktop) grid. "Fully Booked" dates show the next opening message.

---

### 3.09 — Booking: Grouped Service Cards (Step 1)

**Severity:** Medium (UX improvement)
**Target file:** `src/routes/book/-step-service.tsx`
**Reference:** NL `step-service.tsx`

**What to do:**
Replace the flat list of services with grouped category cards. Each category becomes a visual section with a header and a grid of service items.

**NL pattern (`/tmp/nl-audit/src/app/components/booking/step-service.tsx`):**

```tsx
// Group services by category
const grouped = Object.entries(
  services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {}),
);

// Render
{
  grouped.map(([category, items]) => (
    <div key={category}>
      <h3 className="font-display mb-3 text-xl">{category}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const isUnavailable = service.available === false;
          return (
            <button
              key={service.id}
              onClick={() => !isUnavailable && onSelect(service.id)}
              disabled={isUnavailable}
              className={`group relative rounded-xl border p-4 text-left transition-all
              ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : isUnavailable
                    ? "cursor-not-allowed opacity-50"
                    : "border-border bg-surface hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium">{service.name}</h4>
                  {service.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  {/* Duration */}
                  {service.duration_minutes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      ~{service.duration_minutes} min
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-semibold">${Number(service.price).toFixed(0)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  ));
}
```

**Current code to replace:** Flat `<ul className="space-y-2">` with simple `<li>` items.

**Verify:** Step 1 shows services grouped by category, each category has a heading, services in a 1/2-column grid. Selection shows highlighted border.

---

### 3.10 — Reusable Booking-CTA Component

**Severity:** Low (DRY improvement)
**Target file:** `src/routes/index.tsx` + new file `src/components/booking-cta.tsx`
**Reference:** NL `booking-cta.tsx`

**What to do:**
Extract the "Book Now" CTA section (currently inline on the home page) into a reusable component, matching NL's three-variant pattern.

**NL pattern (`/tmp/nl-audit/src/app/components/site/booking-cta.tsx`):**

```tsx
// Accepts a variant prop that controls visual style
// Primary: solid brand background, white text (for home page)
// Secondary: outlined style (for service pages)
// Simple: text-only link (for compact use)

import { Link } from "@tanstack/react-router";

interface BookingCTAProps {
  variant?: "primary" | "secondary" | "simple";
  className?: string;
}

export default function BookingCTA({ variant = "primary", className = "" }: BookingCTAProps) {
  if (variant === "simple") {
    return (
      <Link
        to="/book"
        className={`text-sm font-medium underline-offset-4 hover:underline ${className}`}
      >
        Book an Appointment →
      </Link>
    );
  }

  return (
    <section
      className={`py-16 text-center ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-surface"} ${className}`}
    >
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="font-display text-3xl sm:text-4xl">Ready to Book?</h2>
        <p className="mt-3 text-lg opacity-80">Experience the difference at {getSalonName()}</p>
        <Link
          to="/book"
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3 font-medium transition-all ${
            variant === "primary"
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          Book Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
```

**To do:**

1. Create `src/components/booking-cta.tsx`
2. Replace inline CTA in `src/routes/index.tsx` with `<BookingCTA variant="primary" />`

**Verify:** Home page CTA section looks same as before but now comes from shared component.

---

### 3.11 — Branded 404 Page

**Severity:** Low (quality-of-life)
**Target file:** `src/routes/__root.tsx`
**Reference:** Branded 404 (infer from NL aesthetic)

**What to do:**
Replace the generic `NotFoundComponent` in `__root.tsx` with a branded 404 that matches the salon's aesthetic.

**Current:**

```tsx
// In __root.tsx, around line 27:
const NotFoundComponent = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Go home
        </Link>
      </div>
    </div>
  );
};
```

**Replace with:**

```tsx
const NotFoundComponent = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 text-8xl font-display font-bold text-primary/20">404</div>
        <h1 className="font-display text-3xl">Page Not Found</h1>
        <p className="mt-3 text-muted-foreground">
          Looks like this page got a little lost. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};
```

**Import needed:** `ArrowLeft` from `lucide-react`.

**Verify:** Navigate to `/nonexistent` → see branded 404 page with salon-like typography, back-to-home button.

---

## 4. Risk Register

| #   | Item            | Risk         | Impact if Wrong                                                         | Mitigation                                                               |
| --- | --------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 01  | WaveDivider     | Low          | Overflow/misalignment on mobile                                         | Full-width SVG with `overflow-hidden` wrapper                            |
| 02  | Services grid   | Low          | Data fetch breaks, empty state                                          | Already uses useQuery, error + loading states exist                      |
| 03  | Gallery masonry | Low-Med      | Masonry columns break on resize                                         | CSS columns natively responsive; lightbox Dialog handles close on Escape |
| 04  | Card pattern    | Low          | No breakage, pure restyle                                               | Keep data flow identical                                                 |
| 05  | react-hook-form | Low          | Submit behavior changes                                                 | Keep existing submit handler, wrap fields in Controller                  |
| 06  | Confetti        | Low          | Performance (3s burst only)                                             | 3s duration, respects reduced motion                                     |
| 07  | No Preference   | **Med-High** | Booking created with null staff_id, broken RPC, or wrong staff assigned | Frontend-only approach avoids backend risk; test thoroughly              |
| 08  | Grid time slots | Low          | Slots overflow or clip                                                  | Use `gap-2` with responsive grid cols                                    |
| 09  | Service cards   | Low          | No breakage, pure visual change                                         | Keep data flow same                                                      |
| 10  | Booking CTA     | Low          | No breakage, extracted component                                        | Match existing styles                                                    |
| 11  | Branded 404     | Low          | No breakage, pure visual change                                         | Link to `/` is fallback safe                                             |

---

## 5. Verification Steps

### After implementation, run these checks:

1. **`bun run typecheck`** — All TypeScript strict-mode checks pass
2. **`bun run lint`** — Zero ESLint warnings
3. **`bun run test`** — All 82 existing tests pass (input schemas, env helpers, rate limiter)
4. **`bun dev`** — Dev server starts without errors

### Manual checks:

- **Home page:** Wave transitions visible between sections, services grid shows grouped cards, CTA section renders from shared component
- **Booking wizard:** Step 1 shows grouped service cards, step 2 shows "No Preference" when >1 staff, step 3 shows grid time slots with "Fully Booked" states, step 4 shows Card summary with Row pattern
- **Confirmation page:** Confetti fires on mount (unless reduced motion)
- **Gallery:** Masonry layout, click any image opens lightbox with prev/next
- **404 page:** Navigate to random URL → branded 404 with back button
- **Booking end-to-end:** Complete a real booking flow → confirmation page loads → check DB for correct data
- **"No Preference":** Select "No Preference" → pick time → confirm → verify `bookings.staff_id` is a real UUID (not null, not "no-preference")

---

## 6. Dependency Check

Before starting implementation, verify these packages are already available:

```
# Confetti
bun add canvas-confetti
bun add -d @types/canvas-confetti

# react-hook-form (should exist per TECHNICAL_SPEC)
bun add react-hook-form @hookform/resolvers

# Radix Dialog (should exist if shadcn/ui Dialog component was installed)
# If not: bun add @radix-ui/react-dialog

# Radix Separator (for Card pattern)
bun add @radix-ui/react-separator
```

Run `bun ls` or check `package.json` to confirm.

---

## 7. Reference File Index

### NL repo (design reference — `/tmp/nl-audit/`)

| File                                                           | Purpose                                             |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `/tmp/nl-audit/src/app/pages/booking.tsx`                      | Wizard orchestrator (step management, state)        |
| `/tmp/nl-audit/src/app/pages/booking-confirmed.tsx`            | Confetti + appointment Card                         |
| `/tmp/nl-audit/src/app/pages/gallery.tsx`                      | Masonry + lightbox                                  |
| `/tmp/nl-audit/src/app/pages/home.tsx`                         | WaveDividers, services preview, layout              |
| `/tmp/nl-audit/src/app/components/booking/step-service.tsx`    | Grouped service cards                               |
| `/tmp/nl-audit/src/app/components/booking/step-staff.tsx`      | Staff cards + "No Preference"                       |
| `/tmp/nl-audit/src/app/components/booking/step-time.tsx`       | Grid time slots + "Next Opening"                    |
| `/tmp/nl-audit/src/app/components/booking/step-confirm.tsx`    | Card + react-hook-form                              |
| `/tmp/nl-audit/src/app/components/booking/wizard-progress.tsx` | Tappable progress steps                             |
| `/tmp/nl-audit/src/app/components/site/booking-cta.tsx`        | Reusable CTA variants                               |
| `/tmp/nl-audit/src/app/data/booking.ts`                        | Mock backend (NO_PREFERENCE pattern, error classes) |
| `/tmp/nl-audit/src/app/data/studio.ts`                         | Data shape reference                                |

### Current repo (to modify)

| File                                 | Purpose                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `src/routes/index.tsx`               | Home page — add WaveDividers, services grid, shared CTA |
| `src/routes/gallery.tsx`             | Gallery — masonry + lightbox                            |
| `src/routes/book.tsx`                | Booking wizard orchestrator                             |
| `src/routes/book/-step-service.tsx`  | Step 1 — grouped cards                                  |
| `src/routes/book/-step-staff.tsx`    | Step 2 — "No Preference"                                |
| `src/routes/book/-step-datetime.tsx` | Step 3 — grid time slots                                |
| `src/routes/book/-step-confirm.tsx`  | Step 4 — Card + react-hook-form                         |
| `src/routes/booking-confirmed.tsx`   | Confirmation — confetti                                 |
| `src/routes/__root.tsx`              | 404 — branded                                           |
| `src/components/wave-divider.tsx`    | Already exists, just import                             |
| `src/components/booking-cta.tsx`     | New file — shared component                             |
| `src/lib/booking.functions.ts`       | Backend — maybe extend for "No Preference"              |
| `src/lib/salon.ts`                   | Data — maybe add helpers                                |

---

## 8. Hot-Spare Items — Discovered During Deep Review

The following items were identified during a thorough comparison of the NL repo (cloned to `/tmp/NL-review`) against the current nail-lounge-mp codebase. They are not in the original 11 but represent real gaps in UI/UX polish between the two repos.

| #   | Item                                                           | Area   | Risk | NL File (Reference)          | Current File                      |
| --- | -------------------------------------------------------------- | ------ | ---- | ---------------------------- | --------------------------------- |
| 12  | Hero section: pill badge + gradient overlay + testimonial card | Home   | Low  | `home.tsx` (lines 26–58)     | `src/routes/index.tsx`            |
| 13  | Hours section: "Today" highlight row                           | Home   | Low  | `home.tsx` (lines 148–161)   | `src/routes/index.tsx`            |
| 14  | Service card hover lift (`-translate-y-0.5`)                   | Shared | Low  | `service-card.tsx` (line 14) | Service cards across pages        |
| 15  | Reusable EmptyState component (dashed border Card)             | Shared | Low  | `states.tsx`                 | Scattered inline empty state divs |
| 16  | Footer: WaveDivider + secondary bg + 4-column grid             | App    | Low  | `site-footer.tsx`            | `src/components/footer.tsx`       |
| 17  | Header: minimal nav layout (brand + links + CTA)               | App    | Low  | `site-header.tsx`            | `src/components/header.tsx`       |
| 18  | CSS variables: `--input-background`, `--switch-background`     | Theme  | Low  | `theme.css` (lines 47–48)    | `src/styles.css`                  |

---

### 8.12 — Hero Section: Pill Badge + Gradient Overlay + Testimonial Card

**Severity:** Low (visual polish)
**Target file:** `src/routes/index.tsx`
**Reference:** NL `home.tsx` lines 24–60

**What to do:**
Enhance the home page hero section with three visual touches from NL:

1. **Pill badge** — "Neighborhood studio · est. {year}" with `Star` icon, placed above the heading
2. **Gradient overlay on image** — Subtle white gradient from top of image so it doesn't clip harshly into the container
3. **Testimonial card overlay** — Bottom-overlay card with `backdrop-blur` containing a quote

**NL pill badge:**

```tsx
<span
  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-accent"
  style={{
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  }}
>
  <Star className="size-3 fill-current" /> Neighborhood studio · est. 2019
</span>
```

**NL hero image wrapper with gradient + testimonial card:**

```tsx
<div
  className="relative overflow-hidden rounded-[var(--radius-xl)]"
  style={{ boxShadow: "var(--shadow-3)" }}
>
  <ImageWithFallback
    src={HERO_IMAGE}
    alt="A hand with a fresh, glossy manicure resting on a soft neutral surface"
    className="aspect-[4/5] w-full object-cover"
  />
  {/* Gradient overlay from top */}
  <div
    className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0))" }}
  />
  {/* Testimonial card overlay at bottom */}
  <div
    className="absolute bottom-4 left-4 right-4 rounded-[var(--radius-lg)] bg-card/90 p-4 backdrop-blur"
    style={{ boxShadow: "var(--shadow-2)" }}
  >
    <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
      “The most relaxed I’ve felt in a salon chair.”
    </p>
    <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
      — a regular, five visits in
    </p>
  </div>
</div>
```

**To do:**

1. Add pill badge above the heading with `getSalonName()`, establish year from env or hardcode
2. Wrap hero image in a relative container, add gradient overlay via `bg-gradient-to-b from-white/20 to-transparent`
3. Add testimonial card at bottom with `bg-card/90 backdrop-blur-sm` and `shadow-md`
4. Replace inline `style` font-family with our Tailwind `font-display` / `font-mono` classes

**Verify:** Hero has pill badge above heading, image has subtle gradient at top, testimonial card floats at bottom of image with backdrop blur.

---

### 8.13 — Hours Section: "Today" Highlight Row

**Severity:** Low (UX improvement)
**Target file:** `src/routes/index.tsx`
**Reference:** NL `home.tsx` lines 20, 148–161

**What to do:**
When rendering the hours list on the home page, highlight the current day's row with `bg-secondary` background and append `· today` in accent color after the day name.

**NL pattern:**

```tsx
const today = new Date().getDay(); // 0 = Sunday, matches studio.hours order

{
  studio.hours.map((h, i) => (
    <li
      key={h.day}
      className={`flex items-center justify-between rounded-md px-3 py-2 ${i === today ? "bg-secondary" : ""}`}
      style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
    >
      <span className={i === today ? "" : "text-muted-foreground"}>
        {h.day}
        {i === today && <span className="text-accent"> · today</span>}
      </span>
      <span className={h.open ? "" : "text-muted-foreground/60"}>
        {formatHours(h.open, h.close)}
      </span>
    </li>
  ));
}
```

**Implementation notes:**

- Our hours come from `getSalonHours()` which returns string arrays (e.g. `["Mon–Fri 9–7", "Sat 9–5", "Sun Closed"]`). The NL pattern uses structured objects `{ day, open, close }`.
- **Option A (quick):** Parse the day name from each string, compute `new Date().getDay()`, match to find today's row, add `bg-secondary` + "· today" suffix
- **Option B (better):** Refactor hours to a structured format on the home page, or add a helper that returns structured hours for the UI to consume

**Verify:** On the home page hours section, the current day's row has a secondary background and shows "· today" in accent color.

---

### 8.14 — Service Card Hover Lift

**Severity:** Low (micro-interaction polish)
**Target file:** All interactive card components across the app
**Reference:** NL `service-card.tsx` line 14

**What to do:**
Add `group-hover:-translate-y-0.5` transition to all interactive card-like elements for a subtle lift on hover.

**NL pattern:**

```tsx
<Card className="h-full gap-0 p-6 transition-all group-hover:-translate-y-0.5" />
```

**To do:**

- Wrap each clickable card in `<Link>` or `<button>` with `className="group block ..."`
- Add `transition-all` and `group-hover:-translate-y-0.5` to the inner Card
- Optionally also add `group-hover:shadow-md` for depth
- Target cards: home page featured service cards, booking step-1 service selection, booking step-2 staff cards
- Do NOT apply to gallery tiles (masonry layout) or admin sidebar items

**Verify:** On hover, cards lift ~2px with smooth transition. No layout shift.

---

### 8.15 — Reusable EmptyState Component

**Severity:** Low (DRY improvement, shared infrastructure)
**Target file:** New file `src/components/empty-state.tsx` + update callers
**Reference:** NL `states.tsx`

**What to do:**
Extract a reusable `EmptyState` component that uses a dashed-border Card pattern for graceful "no data yet" states. This replaces scattered inline empty-state divs across both customer-facing AND admin pages.

**NL pattern:**

```tsx
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="items-center gap-3 border-dashed bg-transparent px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <h3 className="font-display text-xl">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
}
```

**Also extract skeleton variants:**

```tsx
export function ServiceCardSkeleton() {
  return (
    <Card className="gap-4 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-16" />
    </Card>
  );
}
```

**Customer-facing callers:** home page (featured services, staff), gallery, services page, booking steps
**Admin callers:** dashboard KPIs loading, commissions empty, waitlist empty, calls empty, alerts empty

**Verify:** Empty states show dashed-border Card with optional icon, centered text. Skeletons match card layout.

---

### 8.16 — Footer: WaveDivider + Secondary BG + 4-Column Grid

**Severity:** Low (visual polish)
**Target file:** `src/components/footer.tsx`
**Reference:** NL `site-footer.tsx`

**What to do:**
Restyle the site footer to match NL's layout:

1. Add `WaveDivider` above the footer (fill matches secondary bg)
2. Use `bg-secondary text-secondary-foreground` as footer background
3. Four-column responsive grid: Brand/tagline · Visit (address, phone, email) · Hours (abbreviated) · Social links
4. Bottom bar with copyright + quick nav links

**NL pattern:**

```tsx
<footer className="mt-24">
  <WaveDivider fill="var(--secondary)" />
  <div className="bg-secondary text-secondary-foreground">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
      {/* Column 1: Brand + tagline */}
      <div className="space-y-3 md:col-span-1">
        <span className="font-display text-xl">{salonName}</span>
        <p className="text-sm opacity-80">{tagline}</p>
      </div>
      {/* Column 2: Visit info */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono">Visit</p>
        <div className="space-y-2 text-sm opacity-90">...icons + address, phone...</div>
      </div>
      {/* Column 3: Hours */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono">Hours</p>
        <ul className="space-y-1 font-mono text-xs">...</ul>
      </div>
      {/* Column 4: Social */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono">Follow</p>
        <ul className="space-y-2 text-sm">...</ul>
      </div>
    </div>
    {/* Bottom bar */}
    <div className="border-t border-foreground/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 text-xs">
        <p className="opacity-60">
          © {new Date().getFullYear()} {salonName}. All payments handled in person.
        </p>
        <div className="flex gap-4 opacity-70">
          <Link to="/services">Services</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/appointments">My appointment</Link>
        </div>
      </div>
    </div>
  </div>
</footer>
```

**Implementation notes:**

- Import `WaveDivider` from `src/components/wave-divider.tsx` (already exists)
- Use `getSalonName()`, `getSalonAddress()`, `getSalonPhone()` from `src/lib/env.ts`
- The `getSalonSocial()` helper returns social links for the Follow column

**Verify:** Footer shows WaveDivider at top, four-column layout on desktop, single column on mobile, bottom bar with copyright and nav links.

---

### 8.17 — Header: Minimal Nav Layout

**Severity:** Low (simplification)
**Target file:** `src/components/header.tsx`
**Reference:** NL `site-header.tsx`

**What to do:**
Simplify the site header to match NL's clean pattern: brand mark left, minimal nav links, one "Book" button right.

**NL pattern:**

```tsx
<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
    <Link to="/" className="transition-opacity hover:opacity-80">
      <span className="font-display text-xl tracking-tight">
        {salonName.split(" ")[0]}
        <span className="text-accent">.</span>
      </span>
    </Link>
    <nav className="hidden items-center gap-8 md:flex text-sm">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              "transition-colors hover:text-foreground",
              isActive ? "text-foreground" : "text-muted-foreground",
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
    <Button size="sm" asChild>
      <Link to="/book">Book</Link>
    </Button>
  </div>
</header>
```

**Implementation notes:**

- NL has 3 nav links: Services, Gallery, Gift Cards (no dropdown, no hamburger on desktop)
- Sticky with `bg-background/80 backdrop-blur`
- Brand mark uses first word of salon name + accent dot (e.g. "Nail.")
- Our TanStack Start app has more routes and may need mobile hamburger — apply NL's desktop pattern, keep mobile nav
- Consider whether to add Gift Cards link or keep current nav items

**Verify:** Desktop header shows brand + compact nav + Book button. Mobile retains current navigation behavior.

---

### 8.18 — CSS Variable Additions

**Severity:** Low (theme completeness)
**Target file:** `src/styles.css`
**Reference:** NL `theme.css` lines 47–48, 110–111

**What to do:**
Add two missing CSS variables to styles.css for form input and toggle switch backgrounds. These are used by shadcn/ui components.

**Add to `@theme inline {}`:**

```css
--color-input-background: oklch(0.93 0.01 80); /* light mode — warm sand */
--color-switch-background: oklch(0.8 0.03 70); /* light mode — tan */
```

**Add to `.dark` selector:**

```css
--color-input-background: oklch(0.22 0.01 150); /* dark mode — dark green-sand */
--color-switch-background: oklch(0.32 0.02 140); /* dark mode — muted olive */
```

**Current state:** Our styles.css has `--color-input` but not `--input-background` or `--switch-background`. These are additive — won't break anything if absent, but adding them ensures theme consistency with shadcn/ui defaults.

**Verify:** `bun run build` passes. No visual regression since nothing currently references these vars.

---

## 9. Amendment Notes to Existing Items

### 3.10 — Booking-CTA: Copy Variants

The guide's `BookingCTA` component uses `primary/secondary/simple` variant names. NL's equivalent uses `hero/band/quiet` with placement-specific copy that avoids the same CTA banner repeating identically on different pages. Consider adopting NL's copy framing:

| Variant | Heading                       | Body                                                                    |
| ------- | ----------------------------- | ----------------------------------------------------------------------- |
| `hero`  | "Ready when you are."         | "Chairs fill up on weekends — reserve yours in about a minute."         |
| `band`  | "Find a time that suits you." | "Pick a service, a stylist, and a slot. No account, no fuss."           |
| `quiet` | "Have something in mind?"     | "Tell us what you're after and we'll match you with the right stylist." |

### 3.01 — WaveDivider: Section Container Pattern

NL wraps each WaveDivider-paired section in a container whose background matches the WaveDivider fill. This creates seamless visual breaks:

```tsx
<section className="bg-card">
  <WaveDivider fill="var(--card)" />
  <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">{/* section content */}</div>
  <WaveDivider fill="var(--card)" flip />
</section>
```

When adding WaveDividers (item 3.01), follow this pattern: wrap in `<section className="bg-card">`, WaveDivider at top + bottom with matching fill and flip.

### 3.06 — Confetti: CSS Custom Properties

NL's confetti pulls colors from CSS variables for theme integration. When implementing (item 3.06):

```tsx
const getCSSVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

canvasConfetti({
  colors: [
    getCSSVar("--primary"),
    getCSSVar("--accent"),
    getCSSVar("--success"),
    getCSSVar("--warning"),
  ],
  // ...
});
```

---

## 10. Staff & Admin Impact Assessment

The NL repo has no admin or staff pages (it's a customer-facing reference app only). However, the patterns extracted from NL touch the same design system our admin/staff pages share. Here's how each migration item affects those areas:

### Admin pages (8 tabs in sidebar layout)

| Item                         | Admin Impact                                                                                                                   | Action                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 01 WaveDivider               | **None** — admin pages don't use WaveDividers                                                                                  | No change                                                                          |
| 02 Services grid             | **None** — admin uses CRUD tables, not service cards                                                                           | No change                                                                          |
| 03 Gallery masonry           | **None** — admin has no gallery view                                                                                           | No change                                                                          |
| 04/05 Card + react-hook-form | **Applicable** — admin Settings tab already has forms. Card patterns can improve commission/waitlist empty states              | Use Card component consistently, not custom divs                                   |
| 06 Confetti                  | **None** — admin doesn't show confirmation                                                                                     | No change                                                                          |
| 07 No Preference             | **None** — admin creates bookings manually                                                                                     | No change                                                                          |
| 08 Grid time slots           | **None** — different UI pattern                                                                                                | No change                                                                          |
| 09 Grouped service cards     | **None** — admin uses table view                                                                                               | No change                                                                          |
| 10 Booking CTA               | **None** — admin pages don't show booking CTAs                                                                                 | No change                                                                          |
| 11 Branded 404               | **Shared** — applies to all routes including admin                                                                             | Already covers all routes via `__root.tsx`                                         |
| 12 Hero pill badge           | **None** — no hero in admin                                                                                                    | No change                                                                          |
| 13 Today highlight           | **Low** — admin dashboard could highlight today in booking list                                                                | Minor enhancement, not critical                                                    |
| 14 Card hover lift           | **Low** — admin sidebar nav already has its own hover style                                                                    | Don't override; sidebar uses its own design                                        |
| 15 EmptyState                | **High** — admin has many empty states (commissions, waitlist, calls, alerts) that can all use the shared EmptyState component | Refactor admin sub-views to use `EmptyState` from `src/components/empty-state.tsx` |
| 16 Footer                    | **None** — admin has no site footer                                                                                            | No change                                                                          |
| 17 Header                    | **None** — admin has its own sidebar + mobile bottom nav                                                                       | No change                                                                          |
| 18 CSS vars                  | **Medium** — `--input-background` affects form inputs in admin Settings tab                                                    | Add vars; admin input styling may slightly change                                  |

### Staff portal (`/staff`, 2 sub-views)

| Item           | Staff Impact                                                                   | Action                                           |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| 11 Branded 404 | **Shared**                                                                     | Already covered                                  |
| 15 EmptyState  | **High** — staff portal shows pending completions modal, no-appointments state | Use shared EmptyState for empty appointment list |
| 18 CSS vars    | **Low** — staff has minimal forms                                              | Add vars as safety net                           |

### Shared infrastructure wins

These NL-inspired components benefit both customer-facing and admin/staff pages:

1. **EmptyState** — One component used everywhere. Dramatically reduces scattered empty state code.
2. **Card + CardContent** — Consistent Card usage across all pages. Admin's `gap-4 p-6` custom card divs can migrate to `<Card>` component.
3. **Theme consistency** — CSS variable additions (`--input-background`, `--switch-background`) provide a safety net for all form inputs across all routes.

### Recommendation for implementation order

```
Phase 1 — Quick Wins (customer-facing + admin-adjacent)
  15 (EmptyState — benefits all pages) → 18 (CSS vars) → 12/13/14/16/17 (home page polish)

Phase 2 — Admin consistency pass
  Refactor admin sub-compoennts with EmptyState → Check Card usage → Verify form input styling
```

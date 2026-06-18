# Phase 1: Foundation

> Build the component building blocks and refactor state from local to URL-driven.
> **No visual changes yet** — everything still renders inside the existing Dialog/BottomSheet.

---

## Goal

Extract all step content into self-contained components, create the shared UI pieces, and move step/selection state into URL search params so that browser back/forward and refresh work properly.

---

## Dependencies

- None. This phase is independent and does not depend on any other phase.

---

## Files to Create

### 1. `src/routes/book/-booking-step-progress.tsx`

A visual step indicator for the 4-step flow.

**Function:**

- 4 numbered circles connected by lines (○───○───○───○)
- Completed steps show a checkmark ✓
- Current step is filled/highlighted
- Future steps are muted/outlined
- Clicking a completed step navigates back to it
- Labels below each step: "Service", "Artist", "Date & Time", "Confirm"
- On mobile: show only circles, hide labels. On desktop: show both.

**Props:**

```ts
{
  step: number;        // 1-4
  onStepClick?: (s: number) => void;
}
```

**States:** Renders immediately — no loading, no error.

**Accessibility:**

- `role="navigation"` with `aria-label="Booking progress"`
- `aria-current="step"` on the active step
- Buttons are disabled for future steps

### 2. `src/routes/book/-booking-summary.tsx`

A live-updating order summary panel.

**Function:**

- Shows currently selected service, artist, date/time
- Shows price breakdown: service price, deposit amount
- Total line at bottom
- Empty state: "You haven't selected anything yet"
- On desktop: rendered in the right sticky sidebar
- On mobile: rendered as a collapsible summary bar at top

**Props:**

```ts
{
  service?: { name: string; price: number; deposit_amount: number };
  staff?: { name: string; avatar_color?: string };
  slot?: Date | null;
  formatTime: (d: Date) => string;
  formatDate: (d: Date) => string;
  formatMoney: (n: number) => string;
}
```

**States:**

- Partial selection (e.g., only service chosen): show what's selected, dim empty slots
- Full selection (step 4): show everything with total
- Empty: "Your selections will appear here"

### 3. `src/routes/book/-step-service.tsx`

Extracted Step 1 — Service selection.

**Props:**

```ts
{
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
```

**Function:**

- Same list UI as current code (button cards with name, category, duration, price)
- Highlighted state with ring on selected item
- Animates selection with subtle scale feedback

**States:** Loading (spinner inside this component's parent), Empty (no services — edge case), List (normal).

### 4. `src/routes/book/-step-staff.tsx`

Extracted Step 2 — Artist/staff selection.

**Props:**

```ts
{
  staff: StaffMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
```

**Function:**

- Avatar circle with initial, name, title/role
- Ring highlight on selected
- Same as current UI

**States:** Loading, Empty, List.

### 5. `src/routes/book/-step-datetime.tsx`

Extracted Step 3 — Date & time picker.

**Props:**

```ts
{
  date: Date;
  onDateChange: (d: Date) => void;
  slot: Date | null;
  onSlotChange: (d: Date) => void;
  slots: Date[];
  loadingSlots: boolean;
}
```

**Function:**

- 14-day horizontal date scroller
- Time slot grid (3 columns)
- Clear "No availability" empty state

**States:** Loading (spinner), Empty ("No availability this day"), Grid of slots.

### 6. `src/routes/book/-step-confirm.tsx`

Extracted Step 4 — Client info + payment + submit.

**Props:**

```ts
{
  service: Service | undefined;
  staff: StaffMember | undefined;
  slot: Date | null;
  name: string;
  phone: string;
  email: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}
```

**Function:**

- Order summary card (service, artist, time, total, deposit)
- Name/phone/email fields
- Mock payment section
- "Pay deposit" submit button
- All input fields forward refs for autofocus

**States:** Idle, Submitting (button disabled + spinner), Validation Error (inline field errors), Server Error (via toast, not inline).

---

## Files to Modify

### `src/routes/book.tsx`

**Changes:**

1. Add an explicit `step` param to the search schema:
   ```ts
   const searchSchema = z.object({
     staff: z.string().uuid().optional(),
     service: z.string().uuid().optional(),
     step: z.coerce.number().min(1).max(4).optional(),
   });
   ```
2. Derive step from URL params:
   - `service` not set → step 1
   - `service` set, `staff` not set → step 2
   - Both set, `slot` not in URL → step 3
   - All set → step 4
   - Or use explicit `?step=N` as override
3. Import and render the new step components instead of inline JSX
4. On step change, update URL search params via `navigate({ to: '/book', search: { ...current, step: newStep } })`
5. Keep the existing Dialog/BottomSheet wrappers intact — they still render
6. Keep existing `bookingStepContent` variable but replace its contents with the new components
7. Add `useNavigate` calls in the existing `setStep` wrapper to also update URL

**State migration:**

- `serviceId` → `search.service` (read from URL)
- `staffId` → `search.staff` (read from URL)
- `step` → derived from `search.step`
- `date`, `slot`, `name`, `phone`, `email` stay as local state (too ephemeral for URL)
- Optional: serialize `slot` timestamp and `date` date string into URL for refresh resilience

**Key behavior preserved:**

- Prefill from `?service=` and `?staff=` search params still works
- Step transitions still work
- Back/close still works

---

## Verification Checklist

- [ ] `bun run build` succeeds
- [ ] All 4 steps render correctly inside the existing Dialog (desktop) and BottomSheet (mobile)
- [ ] Step indicator shows correct state at each step
- [ ] Summary sidebar shows correct selection updates
- [ ] Browser URL updates when advancing/going back through steps
- [ ] Browser back button navigates to previous step (not to `/`)
- [ ] Refreshing the page on step 3 doesn't reset to step 1
- [ ] Prefill from `?service=uuid&staff=uuid` still works from services page and homepage
- [ ] Search params are clean (no duplicate `?service=&service=`)
- [ ] All step components still have proper `tap-target` sizing
- [ ] `aria-live` announcements still work for screen readers
- [ ] Each component file is <100 lines (keep them focused)

---

## Tooling & Execution

### Design Resources

Before starting any visual work in this phase, load these design skill references:

```
skill("design-everyday-things")   // affordances, mental models, error prevention
skill("ui-ux-pro-max")            // UI/UX pattern library, heuristic checks
```

These inform the component structure — proper affordances on selection cards, clear error states on forms, consistent touch targets, etc.

### TypeUI MCP

The project has TypeUI MCP configured in `.opencode/opencode.json`. It's available throughout the build for generating UI component code, organizing Tailwind class lists, and suggesting accessible markup patterns. You can query it for component patterns as you build each step component.

### Parallel Execution Strategy

The 6 components to create are **independent** — they have no cross-dependencies. Launch them as parallel background tasks:

```
Step 1 — dispatch 6 parallel fixer agents:
  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-booking-step-progress.tsx — a 4-step visual progress indicator. Props: { step: number; onStepClick?: (s: number) => void }. 4 circles connected by lines, checkmark on completed, filled on current, outline on future. Labels below: Service, Artist, Date & Time, Confirm. Accessible: role=navigation, aria-current=step. Mobile: circles only. Desktop: circles + labels. Use Tailwind + lucide-react Check icon.")

  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-booking-summary.tsx — order summary showing service, staff, date/time, price breakdown. Props: { service?, staff?, slot?, formatTime, formatDate, formatMoney }. Empty state: 'Your selections will appear here'. Partial state shows what's selected. Full state shows total + deposit. Use Tailwind, responsive.")

  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-step-service.tsx — service selection step. Props: { services: Service[], selectedId, onSelect }. Button cards with name/category/duration/price. Highlighted ring on selected. Loading, empty, and list states. Use Tailwind.")

  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-step-staff.tsx — staff selection step. Props: { staff: StaffMember[], selectedId, onSelect }. Avatar circle, name, title. Ring highlight on selected. Loading, empty, list states. Use Tailwind.")

  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-step-datetime.tsx — date & time picker step. Props: { date, onDateChange, slot, onSlotChange, slots, loadingSlots }. 14-day horizontal date scroller. 3-column time grid. Loading, empty ('No availability'), grid states. Use Tailwind.")

  task(background:true, subagent_type:"fixer", prompt:"Create src/routes/book/-step-confirm.tsx — confirm step with form + payment. Props: { service?, staff?, slot?, name, phone, email, onNameChange, onPhoneChange, onEmailChange, isPending, onSubmit }. Order summary card, name/phone/email fields, mock payment, submit button. States: idle, submitting, validation error. Use Tailwind + shadcn Input/Button.")
```

**After all 6 return:** Merge results, reconcile any import inconsistencies, then modify `book.tsx` (done in the orchestrator) to wire them together with URL-driven state.

### Execution Workflow

1. Load design skills with `skill()` calls
2. Dispatch 6 parallel `fixer` agents to create the components
3. Wait for all to complete via `task_status(task_id, wait:true)`
4. Audits each component for consistency (prop names, import paths, Tailwind classes)
5. Orchestrator modifies `book.tsx` to add search params, wire components, keep existing Dialog/BottomSheet
6. Run `bun run build` to verify
7. Run verification checklist above

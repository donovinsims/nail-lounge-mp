# Phase 4: Cleanup & Polish

> Remove deprecated overlay components, update the services page detail popup, audit all 9 entry points, and run a final responsive QA pass.

---

## Goal

Eliminate every trace of the old modal pattern, fix the services page's service detail popup, and verify the entire site still works end-to-end.

---

## Dependencies

- **Phase 1, 2, AND 3 must be complete** — both desktop and mobile paths are full-page layouts.

---

## Files to Delete

### `src/components/bottom-sheet.tsx`

The Vaul Drawer wrapper. Previously used by:

- `/book` — replaced in Phase 3 (mobile → full-page) and Phase 2 (desktop → two-column)
- `/services` — still used for the service detail popup on mobile

**Action:** After Phase 4.2 below replaces the services popup, verify the `BottomSheet` export is no longer imported anywhere. Then delete the file.

```bash
grep -r "bottom-sheet" src/  # Should return nothing after all replacements
rm src/components/bottom-sheet.tsx
```

---

## Files to Modify

### `src/routes/services.tsx`

**Context:** The services page shows a grid of service cards. Tapping a card opens a detail view. Currently:

- Desktop: `Dialog` overlay
- Mobile: `BottomSheet` drawer

**New approach (both sizes):** Replace the overlay with an inline expanded card. Tapping a service card expands it in-place to show the full description, duration, price, and "Book Now" CTA. Tapping it again (or another card) collapses it.

**Why inline instead of overlay:**

- Consistency — the booking flow is no longer overlay-based
- Better scannability — users can see multiple services and their details at once
- No nested scroll, no modal close confusion
- Simpler code — no Dialog import to manage

**Implementation sketch:**

```tsx
function ServiceCard({ service }: { service: Service }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-white overflow-hidden transition-all">
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="font-medium">{service.name}</h3>
          <p className="text-sm text-muted-foreground">{service.category}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">${service.price}</p>
          <p className="text-xs text-muted-foreground">{service.duration}m</p>
        </div>
      </button>

      {/* Expanded detail — toggled */}
      {isOpen && (
        <div className="border-t px-5 py-4 space-y-4 animate-slideIn">
          <p className="text-sm">{service.description}</p>
          <div className="flex gap-2">
            <Link to="/book" search={{ service: service.id }} className="btn btn-primary flex-1">
              Book Now
            </Link>
            <button className="btn btn-outline">Learn More</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Note:** If a simple accordion feels too basic for the design language, consider a subtle expand animation (max-height transition or grid reflow). The key constraint is: no overlay, no modal, no Vaul drawer.

**Changes to the services page:**

1. Remove `import { BottomSheet } from "@/components/bottom-sheet"`
2. Remove `import { Dialog, DialogContent, ... } from "@/components/ui/dialog"`
3. Remove any `bottomSheetRef` or `open`/`setOpen` state related to the service detail
4. Replace with inline expand/collapse state per card
5. Ensure the "Book Now" link passes `?service=uuid` search params to `/book` (same as before, just no longer hidden inside an overlay)

### `src/routes/book.tsx` — Final cleanup

After Phases 1-3, check for any leftover:

- Hero background markup (background image, "Reserve your seat" heading)
- Unused imports (`Dialog`, `BottomSheet`) — remove them
- Unused state variables (`open`, `setOpen`, `close`)
- Commented-out code blocks from the transition

The final `book.tsx` should be:

- Clean ~400 lines (down from ~600)
- No overlay components
- Imports from `@/components/ui/` should only be form fields and buttons
- All step logic lives in step components

---

## Comprehensive QA — Verify All 9 Entry Points

Test that every entry point linking to `/book` still works end-to-end:

| #   | Entry Point                                            | Link                 | Test                |
| --- | ------------------------------------------------------ | -------------------- | ------------------- |
| 1   | Homepage Hero — "Reserve Your Seat"                    | `/book`              | Opens to step 1     |
| 2   | Homepage — "View Services" → then service → "Book Now" | `/book?service=uuid` | Pre-selects service |
| 3   | Homepage Artist Card — "Book"                          | `/book?staff=uuid`   | Pre-selects staff   |
| 4   | Services page — inline card "Book Now"                 | `/book?service=uuid` | Pre-selects service |
| 5   | Services page sticky CTA — "Reserve Your Appointment"  | `/book`              | Opens to step 1     |
| 6   | Gallery → CTA                                          | `/book`              | Opens to step 1     |
| 7   | Gift Cards → CTA                                       | `/book`              | Opens to step 1     |
| 8   | SiteHeader desktop — "Reserve"                         | `/book`              | Opens to step 1     |
| 9   | SiteFooter — "Book Online"                             | `/book`              | Opens to step 1     |

**Test each entry point on:**

- [ ] Desktop (1440px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)
- [ ] After booking completion (redirects to `/appointments?phone=...`)

---

## Final Verification Checklist

- [ ] `bun run build` succeeds with no warnings
- [ ] `bun run lint` passes
- [ ] `bun run format` passes (Prettier)
- [ ] `bun run dev` starts without errors
- [ ] `src/components/bottom-sheet.tsx` is deleted and no imports reference it
- [ ] `src/components/ui/dialog.tsx` is no longer imported in `/book` or `/services`
- [ ] Services page uses inline expand/collapse, no overlays
- [ ] Route tree regenerated: `bun run route-gen` (if such a script exists) or `bun run build`
- [ ] Robots.txt still disallows `/book` (no change needed — verify)
- [ ] Sitemap.xml unchanged (verify no new routes leaked)
- [ ] Desktop layout: two-column with sticky sidebar
- [ ] Mobile layout: full-page single column with fixed bottom CTA
- [ ] Step progress indicator clickable on completed steps
- [ ] URL params update on each step change
- [ ] Refresh at any step restores selections
- [ ] Browser back navigates to previous step, not away from page
- [ ] No Dialog or BottomSheet CSS/dependencies lingering in the bundle

---

## Bundle Size Check

Confirm the removal actually reduced bundle size:

```bash
# Before/after comparison (approximate)
bun run build 2>&1 | grep -E "(book|bottom-sheet|dialog)"

# Or check the build output
ls -la .vercel/output/static/assets/
```

Expected improvements:

- Removes `vaul` and `@radix-ui/react-dialog` from the booking page bundle
- Reduces JS payload by roughly 15-20 KB (gzipped) for the booking page
- No CSS for modal/drawer animations on the booking page

---

## Regression Risk Areas

1. **Accordion height change on services page:** Inline expand/collapse changes the page layout. Test that the page doesn't "jump" when expanding a card. Use CSS `content-visibility: auto` or a fixed container if needed.

2. **Scroll position on /book:** Full-page layout means the browser manages scroll. Test that focus and scroll position are correct when transitioning between steps (especially step 3 → 4 where the form appears).

3. **Mobile CTA + keyboard:** Critical edge case on step 4. The fixed bottom bar must not overlap the virtual keyboard. Test on iOS Safari (the most restrictive browser for this).

4. **Browser history stack:** With URL-driven step state, every step transition pushes a new history entry. Verify that pressing "Back" 4 times from step 4 returns to the previous page (not stuck in a step loop). Consider `navigate({ ...search, step: s }, { replace: true })` for step → step transitions to keep a single entry, and only "Back to site" pushes a true history entry.

5. **Server functions unchanged:** `createPublicBooking`, `lookupAppointments`, `cancelPublicBooking` — no changes needed. Verify they still work by running through the full booking flow locally.

---

## Tooling & Execution

### Design Resources

Load these skills before redesigning the services page expand/collapse pattern:

```
skill("design-everyday-things")   // affordance for expandable cards, feedback on tap
skill("ui-ux-pro-max")            // accordion/collapse patterns, card component patterns
```

The services page inline expand replaces the old Dialog/BottomSheet overlay — the design skills ensure the new interaction feels natural.

### TypeUI MCP

Use for:

- Generating the expand/collapse card component with smooth height animation
- Ensuring accessible accordion patterns (ARIA `expanded`, `controls`)
- Responsive card grid layout

### Parallel Execution Strategy

Phase 4 has multiple independent workstreams that can run in parallel:

1. **Services page inline cards** (fixer agent):

   ```
   task(background:true, subagent_type:"fixer", prompt:"Modify src/routes/services.tsx to replace overlay dialogs with inline expand/collapse cards. Remove Dialog and BottomSheet imports. Each service card has a clickable header (name, category, price) that expands to show full description + 'Book Now' and 'Learn More' buttons. Tapping another card or same card collapses. Use useState per card for expand state. Link to /book?service=uuid. Tailwind, smooth height transition, accessible (aria-expanded, aria-controls).")
   ```

2. **`book.tsx` import cleanup** (orchestrator or fixer):

   ```
   task(background:true, subagent_type:"fixer", prompt:"Clean up src/routes/book.tsx — remove any remaining references to BottomSheet, Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription from imports. Remove any Hero background markup. Remove unused state variables (open, setOpen, close). The desktop and mobile paths should use the same page layout components. Run bun run build after changes.")
   ```

3. **Delete bottom-sheet.tsx** (orchestrator — simple rm + verify)

4. **Entry point audit** (orchestrator — manually check all 9 links)

5. **Final build + lint + format** (orchestrator — run scripts)

### Execution Workflow

1. Load design skills
2. Dispatch services page and book.tsx cleanup as parallel background tasks
3. While those run, orchestrator deletes `bottom-sheet.tsx` and runs the entry point audit
4. Wait for both background tasks to complete
5. Run `grep -r "bottom-sheet" src/` to verify no imports remain
6. Run `bun run build`, `bun run lint`, `bun run format`
7. Run the full verification checklist
8. Run through all 9 entry points end-to-end
9. Check bundle size improvement

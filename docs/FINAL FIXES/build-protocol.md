# Build Protocol — nail-lounge UI Migration

> **Purpose:** Execution rules for the NL repo UI migration (18 items across 4 phases).
> These are **binding instructions** for every agent involved in this build.
> **Sources of Truth:** NL reference repo (`/tmp/NL-review/`), migration guide (`nl-repo-ui-migration-guide.md`), this protocol.

---

## 1. Ground Rules (Non-Negotiable)

### 1.1 Read-Before-Write

Before modifying any file, re-read its current state. Never edit from memory.

- If an agent says "I know what that file looks like" — stop. Read it.
- The NL reference is at `/tmp/NL-review/`. Every item's NL file path is in the guide. Read it before implementing.

### 1.2 One Item at a Time

Each guide item (3.01–3.11, 8.12–8.18) is an atomic unit.

- Implement one. Verify it. Mark complete. Move to next.
- Never batch-implement items that touch different files.

### 1.3 Verification Gates

Every item in the guide has a `Verify:` step. Run it before marking the item done.

```bash
bun run typecheck   # after every file change
bun run test        # after every phase
bun run lint        # before PR
```

### 1.4 Staged by Dependency

```
Phase 1 — EmptyState + CSS vars + home page polish  (no deps)
Phase 2 — Booking UX/UI items (3.09→3.08→3.04/3.05→3.06)
Phase 3 — Gallery (3.03)
Phase 4 — "No Preference" (3.07 — last because highest risk)
Phase 5 — Admin consistency pass (Section 10)
```

### 1.5 Subagent Discipline

| Type              | When                                              | Verification                      |
| ----------------- | ------------------------------------------------- | --------------------------------- |
| `@designer`       | UI/UX visual changes (cards, hero, EmptyState)    | Returns after `bun run typecheck` |
| `@fixer`          | Mechanical code changes (CSS vars, confetti, 404) | Returns after `bun run typecheck` |
| `@oracle`         | Code review after each phase                      | Quality gate                      |
| `ux-review` skill | Design review after Phase 2 and final             | Quality gate                      |

Each subagent task prompt must include:

1. The exact guide lines to follow (e.g., "Guide lines 622-689")
2. The NL reference file to read (`/tmp/NL-review/...`)
3. The current target file to read
4. "Return after `bun run typecheck` passes"

---

## 2. Hallucination Prevention System

### 2.1 The Three Reads

Before writing any code, the implementing agent must do:

1. **Read the guide section** for the item (exact lines)
2. **Read the NL reference file** (exact pattern, not memory)
3. **Read the current target file** (current state, not assumption)

### 2.2 The Pattern Match Check

Before saving, verify every class name and pattern matches something that actually exists in the project:

- ❌ `bg-surface-2` — does this Tailwind class exist? Check `styles.css`
- ❌ `rounded-[var(--radius-xl)]` — does this CSS var exist? Check `@theme inline {}`
- ✅ `bg-surface` — confirmed in styles.css with `oklch(0.93 0.01 80)`

### 2.3 NL Ground Truth over Memory

When there's doubt between "what I think NL does" and what NL actually has:

- Read the NL file, not your memory
- The NL reference is **ground truth** for visual patterns
- The migration guide is **ground truth** for implementation specs
- If the guide and NL disagree, read both and reconcile

### 2.4 Stale Context Detection

If implementing after a context compress, re-read:

- The target file (it may have changed since compress)
- The guide section for the item
- The NL reference file
  Do NOT rely on compressed summaries for exact code patterns.

### 2.5 The 3-Minute Rule

If an agent spends >3 minutes debugging an issue without finding the root cause:

1. Stop and report what was tried
2. Re-read the NL reference for the pattern
3. Re-read the target file current state
4. Use `@oracle` for debugging strategy

---

## 3. Design Mentor: UI UX Pro Max

> **Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
> **Role:** Strategic design system generator + quality validator
> **Apply when:** Making any visual design decision, choosing patterns, reviewing layout

### 3.1 Mandatory Checks for Every Page/Touch

Copy the table below into every subagent prompt that touches UI:

| Priority | Category                | Key Checks                                                                      | Anti-Patterns                                                  |
| -------- | ----------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1        | **Accessibility**       | Contrast ≥4.5:1, alt text, keyboard nav, aria-labels, focus rings visible       | Removing focus rings, icon-only buttons without labels         |
| 2        | **Touch & Interaction** | Min 44×44pt tap target, 8px+ spacing, loading feedback, cursor-pointer          | Reliance on hover only, instant state changes (0ms)            |
| 3        | **Performance**         | WebP/AVIF, lazy load, reserve space (CLS < 0.1), `touch-action: manipulation`   | Layout thrashing, Cumulative Layout Shift                      |
| 4        | **Style Consistency**   | Match product type (Beauty/Spa), SVG icons (no emojis), one icon set            | Mixing flat/skeuomorphic styles randomly, emoji as icons       |
| 5        | **Layout & Responsive** | Mobile-first breakpoints, no horizontal scroll, min 16px body, read 35-60 chars | Fixed px widths, disable zoom, horizontal scroll               |
| 6        | **Typography & Color**  | Semantic color tokens (no raw hex in components), font-display for headings     | Text < 12px body, gray-on-gray, raw hex                        |
| 7        | **Animation**           | 150-300ms duration, transform/opacity only, exit faster than enter              | Animating width/height, no reduced-motion respect              |
| 8        | **Forms & Feedback**    | Visible labels, error near field, progressive disclosure, submit feedback       | Placeholder-only labels, errors at top only, overwhelm upfront |
| 9        | **Navigation**          | Predictable back, persistent nav, step indicator in multi-step flows            | Overloaded nav, broken back behavior                           |

### 3.2 Beauty/Spa-Specific Rules (Directly Relevant)

The UI UX Pro Max reasoning engine specifies these for the Beauty/Spa product type:

**Recommended Pattern:** Hero-Centric + Social Proof

- Conversion: Emotion-driven with trust elements
- CTA: Above fold, repeated after testimonials

**Recommended Style:** Soft UI Evolution

- Keywords: Soft shadows, subtle depth, calming, premium feel, organic shapes
- Performance: Excellent | Accessibility: WCAG AA

**Recommended Colors (for reference, we use Coastal Neutral):**

- Our palette already aligns with spa/wellness direction
- Anti-pattern: Bright neon colors, harsh animations, AI purple/pink gradients

**Recommended Typography Mood:** Elegant, calming, sophisticated

- Our stack already uses Fraunces (display) + Inter (body) — correct pairing per UI UX Pro Max

### 3.3 Pre-Delivery Checklist (from UI UX Pro Max)

Copy into every subagent prompt that returns UI code:

```
□ No emojis as icons (use SVG: Lucide icons)
□ cursor-pointer on all clickable elements
□ Hover states with smooth transitions (150-300ms)
□ Light mode: text contrast 4.5:1 minimum
□ Focus states visible for keyboard nav
□ prefers-reduced-motion respected
□ Responsive: 375px, 768px, 1024px, 1440px
□ Semantic theme tokens used (no raw hex/per-screen hardcoded colors)
□ All tappable elements provide clear pressed feedback
□ Safe areas respected for headers, tab bars, bottom CTAs
□ Scroll content not hidden behind fixed bars
```

---

## 4. Design Mentor: Make Interfaces Feel Better

> **Source:** https://github.com/jakubkrehel/make-interfaces-feel-better
> **Role:** Micro-polish and precision execution — the small details that separate good from great
> **Apply when:** Implementing any interactive component, card, button, or animation

### 4.1 The 16 Principles (Apply ALL)

Copy this checklist into every subagent prompt that touches CSS/components:

```
□ 1. CONCENTRIC BORDER RADIUS
     outerRadius = innerRadius + padding
     Check: Card (rounded-xl) → inner content (rounded-lg) → padding (p-4)
     Does 16px = 8px + 8px? Yes. ✓
     Does 12px = 8px + 4px? Yes. ✓

□ 2. OPTICAL OVER GEOMETRIC ALIGNMENT
     Icon padding = text side - 2px
     Play triangle: margin-left: 2px
     Button icons need 2px less horizontal padding than text labels

□ 3. SHADOWS OVER BORDERS
     Replace `border border-border` on cards/buttons with layered box-shadow
     Light: 0px 0px 0px 1px rgba(0,0,0,0.06), 0px 1px 2px -1px rgba(0,0,0,0.06), 0px 2px 4px 0px rgba(0,0,0,0.04)
     Dark: 0 0 0 1px rgba(255,255,255,0.08)
     Does NOT apply to dividers or layout-separating borders

□ 4. INTERRUPTIBLE ANIMATIONS
     Use CSS transitions for interactive state changes (interruptible)
     Use keyframes only for one-shot sequences (enter, loading)
     Never keyframes for hover/toggle/press states

□ 5. SPLIT & STAGGER ENTER ANIMATIONS
     Break container into semantic chunks
     Stagger children: ~100ms between each
     Titles: consider word-level stagger at ~80ms

□ 6. SUBTLE EXIT ANIMATIONS
     translateY(-12px) — small fixed distance, not full height
     Exit duration: 150ms (shorter than enter's 300ms)
     Soft easing — focus is moving to next thing

□ 7. CONTEXTUAL ICON ANIMATIONS
     opacity 0→1 + scale 0.25→1 + blur 4px→0px
     Spring with bounce=0
     No motion library? CSS cross-fade with both icons in DOM

□ 8. FONT SMOOTHING
     -webkit-font-smoothing: antialiased on root <html> (macOS only)
     Apply once at root, not per-element

□ 9. TABULAR NUMBERS
     font-variant-numeric: tabular-nums for:
       - Prices, durations, counters
       - Table columns with numbers
       - Any dynamically updating numeric display

□ 10. TEXT WRAPPING
      Headings (≤6 lines): text-wrap: balance
      Body/short text: text-wrap: pretty
      Long text (10+ lines), code: neither

□ 11. IMAGE OUTLINES
      outline: 1px solid rgba(0,0,0,0.1) — pure black
      outline-offset: -1px
      Dark mode: 1px solid rgba(255,255,255,0.1) — pure white
      Use `outline` not `border` (no layout shift)

□ 12. SCALE ON PRESS
      active:scale-[0.96] (never smaller than 0.95)
      CSS transitions for interruptibility
      Optional static prop to disable

□ 13. SKIP ANIMATION ON PAGE LOAD
      initial={false} on AnimatePresence for default-state elements
      (icon swaps, toggles, tabs)
      NOT for first-time entrance animations (staggered heroes)

□ 14. NO `transition: all` EVER
      Specify exact properties: transition-[scale,opacity,filter]
      Tailwind's transition-transform covers: transform, translate, scale, rotate
      Check: transition duration-150 → this maps to transition: all! Bad.

□ 15. USE will-change SPARINGLY
      Only on: transform, opacity, filter, clip-path
      Never: will-change: all or will-change: width, top, left
      Only add when first-frame stutter is observed (Safari benefits most)

□ 16. MINIMUM HIT AREA
      Interactive elements: 40×40px minimum
      Small controls: extend with ::after pseudo-element
      Never let hit areas overlap
```

### 4.2 Common Mistakes Table (from make-interfaces-feel-better)

Check for these specifically during code review:

| Mistake                                | Fix                                      |
| -------------------------------------- | ---------------------------------------- |
| Same border radius on parent and child | `outerRadius = innerRadius + padding`    |
| Icons look off-center                  | Adjust optically with padding or fix SVG |
| Hard borders between sections          | Layered `box-shadow` with transparency   |
| Jarring enter/exit animations          | Split, stagger, keep exits subtle        |
| Numbers cause layout shift             | Apply `tabular-nums`                     |
| Heavy text on macOS                    | Apply `antialiased` to root              |
| Animation plays on page load           | `initial={false}` on `AnimatePresence`   |
| `transition: all` on elements          | Specify exact properties                 |
| First-frame animation stutter          | Add `will-change: transform` (sparingly) |
| Tiny hit areas on small controls       | Extend with pseudo-element to 40×40px    |

---

## 5. NL Reference Verification Protocol

### 5.1 Before Writing Code

For each guide item, the implementing agent MUST:

1. **Open the NL reference file** at `/tmp/NL-review/` and read the exact pattern
2. **Copy the pattern** (not paraphrase) into their working notes
3. **Read the current target file** to understand what exists
4. **Convert NL patterns to our stack:**
   - NL's `style={{ fontFamily: "var(--font-mono)" }}` → `className="font-mono"`
   - NL's CSS vars → our `@theme inline {}` tokens
   - NL's `rounded-[var(--radius-xl)]` → our `rounded-2xl` (verify mapping)
   - NL's `bg-card/90` → our `bg-card/90` (verify `--color-card` exists)
   - NL's `backdrop-blur` → our `backdrop-blur-sm`

### 5.2 Component Mapping (NL → Our Repo)

| NL Pattern                   | Our Equivalent            | Notes                    |
| ---------------------------- | ------------------------- | ------------------------ |
| `rounded-[var(--radius-xl)]` | `rounded-2xl` (16px)      | Verify token             |
| `rounded-[var(--radius-lg)]` | `rounded-xl` (12px)       | Verify token             |
| `shadow-2`                   | `shadow-md`               | Verify mapping           |
| `shadow-3`                   | `shadow-lg`               | Verify mapping           |
| `font-mono`                  | `font-mono`               | Same                     |
| `font-display`               | `font-display` (Fraunces) | Same                     |
| `bg-card/90`                 | `bg-card/90`              | `--color-card` exists    |
| `bg-surface`                 | `bg-surface`              | `--color-surface` exists |
| `text-accent`                | `text-accent`             | `--color-accent` exists  |

### 5.3 After Writing Code

Compare the output against the NL reference one more time:

- Does the visual hierarchy match?
- Are animation timings the same?
- Are spacing proportions consistent?
- Did we lose any NL detail in translation?

---

## 6. Review Gates

### 6.1 Per-Item Review (Built-in)

Each guide item has a `Verify:` step. Run it.

### 6.2 Per-Phase Review

After each phase completes:

1. `bun run typecheck` — must pass with zero errors
2. `bun run test` — all 82+ tests must pass
3. `bun run lint` — zero warnings

### 6.3 Design Review (End of Phase 2 and Final)

Run the `ux-review` skill:

```markdown
Please run a UX review of the recent changes covering:

- Home page hero, hours, EmptyState, footer
- Booking wizard steps 1-4
- Booking confirmed page
- 404 page
  Focus on: visual hierarchy, spacing consistency, animation polish, touch targets, accessibility
```

### 6.4 Code Review (End of Each Phase)

Use `@oracle` with the prompt:

```
Review the code changes in Phase {N}. Check for:
- Are NL patterns correctly adapted (not blindly copied)?
- Any anti-patterns from make-interfaces-feel-better?
- Any missing accessibility from UI UX Pro Max checklist?
- Is the code maintainable and consistent with our stack?
```

### 6.5 Final Gate

Before marking migration complete:

1. All 18 items verified
2. All 4 review gates passed
3. `bun run typecheck && bun run test && bun run lint` — all green
4. Manual walkthrough of booking flow end-to-end on dev server

---

## 7. Agent Prompt Template

Use this template for every subagent dispatch:

```
You are implementing migration guide item {NUMBER}: {TITLE}.

## Sources
- Guide: docs/FINAL FIXES/nl-repo-ui-migration-guide.md (lines {START}-{END})
- NL Reference: /tmp/NL-review/{PATH}
- Current file: {FILEPATH}

## Step 1 — Read
Read all three sources above before writing any code.

## Step 2 — Design Checklist (UI UX Pro Max)
[Paste Section 3.1 table from build protocol]
[Paste Section 3.3 pre-delivery checklist]

## Step 3 — Polish Checklist (Make Interfaces Feel Better)
[Paste Section 4.1 16-point principles checklist]

## Step 4 — Implement
Implement the change. Adapt NL patterns to our Tailwind v4 + shadcn/ui stack.
- NL inline styles → our Tailwind classes
- NL CSS vars → our @theme inline tokens
- Verify component mapping from build protocol Section 5.2

## Step 5 — Verify
[From the guide's Verify: step]
Run: bun run typecheck
Return only after typecheck passes and the verify step confirms the change.

## Step 6 — Report
Return: what changed, what NL pattern was adapted, any deviations from NL and why.
```

---

## 8. Emergency Stop Conditions

Stop execution and report if any of these occur:

1. **Typecheck fails** and the cause is unclear after 3 minutes
2. **NL reference and guide disagree** on a pattern
3. **A change breaks existing behavior** unexpectedly
4. **Context was compressed** since last reading target files (re-read before continuing)
5. **A subagent returns hallucinated code** (classes that don't exist, patterns that don't match NL)

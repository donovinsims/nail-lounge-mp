# Genericization Roadmap — Nail Lounge → Generic Salon Template

> **Goal:** Transform the Nail Lounge-specific booking/POS application into a fully generic, brandable template that any salon can deploy.
> **Source branches:** All hardcoded "Nail Lounge" references → DB-driven configuration + env vars.
> **Total inventory:** ~56 hardcoded references across ~25 files. 15 blockers, ~18 high, ~12 medium, ~11 low.

---

## Phase 0: Prerequisites & Safety (1-2 hours)

### P0.1 — Rotate Compromised Secrets
- Rotate the committed `SUPABASE_SERVICE_ROLE_KEY` in the Supabase dashboard
- Add `.env` to `.gitignore`
- Create `.env.template` with all production keys (see below)

### P0.2 — Clean Up Duplicate Tree
- Delete the redundant `mynails/` subdirectory (copy of `src/`)
- Verify no imports break

### P0.3 — Gate Seed Demo Data
- Add `VITE_ALLOW_SEED_DATA` env var (default `false`)
- In `seedDemoData()`, check env gate before running
- Remove "Seed Demo Data" button from admin UI in production

### P0.4 — Disable Dangerous Defaults
- Remove `linkSelfToFirstSalon()` auto-run on admin mount
- Remove auto-seed on dashboard mount
- Replace with explicit admin onboarding flow

---

## Phase 1: Database-Backed Salon Configuration (4-6 hours)

### 1.1 — Add `salon_settings` Columns or Table

The `salons` table already has a `settings` jsonb column. Use this pattern:

```sql
-- settings jsonb structure:
{
  "hours": {
    "monday": {"open": "09:00", "close": "19:00"},
    ...
  },
  "brand": {
    "primaryColor": "#E8A0B4",
    "secondaryColor": "#D4A0A0"
  },
  "gallery": ["url1", "url2"],
  "social": {
    "instagram": "https://instagram.com/salon",
    "facebook": "https://facebook.com/salon",
    "tiktok": "https://tiktok.com/@salon",
    "youtube": "https://youtube.com/@salon",
    "booksy": "https://booksy.com/salon",
    "yelp": "https://yelp.com/salon"
  }
}
```

**Migration needed:** None — column already exists. Just update the seed/read patterns.

### 1.2 — Add SALON_ID Env Var

```env
SALON_ID=11111111-1111-1111-1111-111111111111
```

Update all `fetchSalon()` and related queries to filter by `process.env.SALON_ID` server-side or by `salon_id` column in RLS queries.

### 1.3 — Create Initial Salon Onboarding Flow

Admin sign-up flow:
1. Admin creates account → gets magic link
2. First-time admin sees "Set up your salon" wizard
3. Wizard creates salon record → generates UUID → links admin staff profile
4. Stores `SALON_ID` in settings/env for subsequent runs

---

## Phase 2: Hardcoded Reference Sweep (2-3 hours)

### BLOCKER (15 items) — Must fix before any deployment

| # | File | What to change | Replacement |
|---|------|---------------|-------------|
| B1 | `src/lib/salon.ts` — `BUSINESS` constant | Entire constant object | Read from `salons` table via `fetchSalon()` |
| B2 | `src/routes/__root.tsx` — JSON-LD | Hardcoded `NailSalon` schema with Nail Lounge details | Template from DB or env vars |
| B3 | `src/routes/__root.tsx` — Meta tags | `title: "Nail Lounge"` | `salon.name` from DB |
| B4 | `src/routes/index.tsx` — Hero text | `"Nail Lounge"` in h1 | `salon.name` |
| B5 | `src/routes/index.tsx` — Hero subtitle | `"Machesney Park's premier nail salon"` | `salon.address` based tagline |
| B6 | `src/routes/index.tsx` — Testimonial | `"Maya R."`, quote about Nail Lounge | Configurable via DB or remove |
| B7 | `src/routes/book.tsx` — Confirmation | `"Nail Lounge"` in booking confirm text | `salon.name` |
| B8 | `src/routes/appointments.tsx` | `"Nail Lounge"` in headings | `salon.name` |
| B9 | `src/routes/services.tsx` | `"Nail Lounge"` in page title | `salon.name` |
| B10 | `src/routes/gallery.tsx` | `"Nail Lounge Gallery"` | `salon.name + " Gallery"` |
| B11 | `src/routes/gift-cards.tsx` | `"Nail Lounge Gift Cards"` | `salon.name + " Gift Cards"` |
| B12 | `src/supabase/seed.sql` | Hardcoded salon UUID + name/staff/services | Parameterized or template-based |
| B13 | `public/images/` | `nailpolish.jpg`, `salon-interior.jpg` | Admin-uploaded or placeholder |
| B14 | `src/lib/salon.ts` — `fetchSalon()` uses `.limit(1)` | Assumes single salon | Filter by `SALON_ID` env var |
| B15 | `src/lib/booking.functions.ts` | `lookupAppointments` and `cancelPublicBooking` no salon_id filter | Add `salon_id` parameter + filter |

### HIGH (18 items) — Fix before deploying to a second salon

| # | Files | Issue | Fix |
|---|-------|-------|-----|
| H1 | `index.tsx` hero | Static "See Our Services" button — links to `/services` | Keep static, but verify path |
| H2 | `index.tsx` service cards | Hardcoded service names in featured section | Fetch from `services` table |
| H3 | `index.tsx` hours | Static "Mon–Sat: 9am–7pm, Sun: 10am–5pm" | Read from `salon.settings.hours` |
| H4 | `index.tsx` address | "1513 West Lane Rd" hardcoded in contact section | `salon.address` |
| H5 | `index.tsx` phone | "+1 815-977-3443" | `salon.phone` |
| H6 | `index.tsx` email | "mynailsalon@nail-lounge.com" | `salon.email` |
| H7 | `index.tsx` social links | "Follow Us" Instagram/TikTok/Facebook | `salon.settings.social` |
| H8 | `__root.tsx` meta description | "Nail Lounge — Machesney Park, IL" | `salon.name + " — " + salon.address` |
| H9 | `__root.tsx` OG tags | og:title, og:description, og:image | Configurable from DB |
| H10 | `services.tsx` | Page title "Our Services at Nail Lounge" | `salon.name` |
| H11 | `services.tsx` | "Book at Nail Lounge" CTA | `salon.name` |
| H12 | `book.tsx` step headers | "Book at Nail Lounge" | `salon.name` |
| H13 | `gift-cards.tsx` | "Purchase a Nail Lounge Gift Card" | `salon.name` |
| H14 | `book.tsx` confirmation | "Thank you for booking with Nail Lounge" | `salon.name` |
| H15 | `appointments.tsx` | "Your Nail Lounge Appointments" | `salon.name` |
| H16 | `-admin-settings.tsx` | Limited editing (no staff/service CRUD) | Add staff CRUD + service CRUD |
| H17 | `-admin-settings.tsx` | Hours not editable | Add hours editor in settings |
| H18 | `-admin-settings.tsx` | Social links not editable | Add social link editor in settings |

### MEDIUM (12 items) — Enhance after core genericization

| # | Issue | Approach |
|---|-------|----------|
| M1 | `fetchSalon()` only called in some places | Create a React context or TanStack Router loader that fetches salon data once |
| M2 | No loading/skeleton states for salon data | Add suspense boundaries |
| M3 | Admin console should show salon name in header | Read from context |
| M4 | Gallery images hardcoded | Add Supabase Storage bucket for gallery uploads |
| M5 | Staff images hardcoded | Add admin staff image management |
| M6 | No salon-branded email templates | Template-based with salon.name/address/logo |
| M7 | Logo not configurable | Admin logo upload → Supabase Storage |
| M8 | Color scheme hardcoded in Tailwind config | CSS variables driven by `salon.settings.brand` |
| M9 | Booking confirm text hardcoded | DB-driven confirmation messages |
| M10 | Cancellation policy text hardcoded | Admin-editable policies |
| M11 | `seed.sql` has no parameterization | Convert to migration with variables |
| M12 | Multiple salons in one DB need RLS coverage for `profiles` INSERT | Add RLS policy |

### LOW (11 items) — Polish

| # | Issue |
|---|-------|
| L1 | All image alt text references "Nail Lounge" |
| L2 | sitemap.xml has hardcoded URL |
| L3 | robots.txt hardcoded |
| L4 | 404 page references Nail Lounge |
| L5 | Error boundary text references Nail Lounge |
| L6 | Loading spinner text references Nail Lounge |
| L7 | `metadata` exports in some route files |
| L8 | "Powered by Nail Lounge" footer |
| L9 | Booking wizard step titles |
| L10 | Confirmation SMS/email templates (future) |
| L11 | Social media preview images |

---

## Phase 3: Admin Console Enhancements (8-12 hours)

### 3.1 — Staff CRUD
- Add `CreateStaff`, `EditStaff`, `DeleteStaff` server functions
- Add admin UI: staff list → add/edit modal → form with name, title, bio, image, commission %
- Store staff images in Supabase Storage

### 3.2 — Services CRUD
- Add `CreateService`, `EditService`, `DeleteService` server functions
- Add admin UI: service list grouped by category → add/edit modal → form with name, duration, price, category
- Support drag-to-reorder (sort_order column exists)

### 3.3 — Gallery Management
- Add Supabase Storage bucket for gallery images
- Admin upload UI with preview, delete, reorder

### 3.4 — Settings Expansion
- Hours editor per day of week (open/close/closed all day)
- Social link editor (Instagram, TikTok, Facebook, YouTube, Booksy, Yelp)
- Brand color picker (primary, secondary)
- Cancellation policy text editor
- Business hours display preferences

### 3.5 — Data Isolation Verification
- Audit every server function for `salon_id` filter
- Add `salon_id` to all RLS policies where missing
- Verify `lookupAppointments` scoped to salon
- Verify `cancelPublicBooking` scoped to salon
- Add integration test for cross-tenant isolation

---

## Phase 4: Integration Points (10-20 hours)

### 4.1 — Stripe Payment
- [ ] Install Stripe SDK (`stripe` npm package)
- [ ] Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to env
- [ ] Create Stripe Elements checkout component
- [ ] Build Stripe webhook handler → update booking status
- [ ] Implement refund flow in POS
- [ ] Add deposit-optional payment (pay now vs pay in salon)

### 4.2 — SMS/Email Notifications
- [ ] Install Twilio SDK (SMS) + Resend/SendGrid (email)
- [ ] Booking confirmation notification
- [ ] Booking reminder (24h before)
- [ ] Waitlist notification (spot available)
- [ ] Cancellation notification
- [ ] No-show follow-up

### 4.3 — AI Receptionist (Optional)
- [ ] Twilio Voice webhook setup
- [ ] LLM integration (VAPI.ai, Retell, or Bland AI)
- [ ] Booking creation from phone call
- [ ] Call transcript/logging to `ai_calls` table

### 4.4 — Waitlist → Booking Conversion
- [ ] Realtime subscription for waitlist changes
- [ ] Click to convert waitlist entry → pre-filled booking
- [ ] Auto-notify when spot opens up

---

## Phase 5: Quality & Testing (8-16 hours)

### 5.1 — Test Infrastructure
- [ ] Choose test framework (Vitest recommended — matches Vite ecosystem)
- [ ] Set up Supabase test helpers (local Supabase instance or mocks)
- [ ] Add `.github/workflows/test.yml`

### 5.2 — Unit Tests
- [ ] `salon.ts` — slot computation logic
- [ ] `utils.ts` — formatting functions
- [ ] Zod validation schemas
- [ ] Commission calculation edge cases

### 5.3 — Integration Tests
- [ ] Booking CRUD flow (create → lookup → cancel)
- [ ] Auth flow (magic link → session)
- [ ] RLS policy enforcement per salon

### 5.4 — E2E Tests (Optional)
- [ ] Playwright — booking wizard completion
- [ ] Playwright — admin dashboard load
- [ ] Playwright — staff management

---

## Phase 6: Production Hardening (4-8 hours)

### 6.1 — Rate Limiting
- Add rate limiting to public booking endpoint (e.g., 5 bookings per phone per hour)
- Add rate limiting to auth endpoint

### 6.2 — Race Condition Fix
- Add database exclusion constraint for overlapping booking slots:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    staff_id WITH =,
    tsrange(start_time, end_time) WITH &&
  )
  WHERE (status != 'cancelled');
```

### 6.3 — Realtime Security
- Verify Realtime channels are restricted to authenticated users for admin data
- Public Realtime only for floor_status (with column-level restrictions)

### 6.4 — .env.template

```env
# === Required ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_SITE_URL=https://yoursalon.com
SALON_ID=uuid-for-this-salon

# === Optional — integrations ===
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
VAPI_API_KEY=...

# === Feature Flags ===
VITE_ALLOW_SEED_DATA=false
```

### 6.5 — CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck
  lint:
    steps:
      - ... run: bun run lint
  test:
    steps:
      - ... run: bun run test
```

---

## Implementation Order (Priority Queue)

For a developer picking this up:

### Week 1 — Foundation (15-20 hours)
1. **Phase 0** (secrets, duplicate cleanup, seed gate, dangerous defaults)
2. **Phase 1** (env vars, DB-backed salon config, onboarding flow)
3. **Phase 2 blockers** (15 BLOCKER items) — sweep all hardcoded Nail Lounge refs
4. **Phase 2 high** (18 HIGH items) — sweep remaining display text

### Week 2 — Admin Power (20-30 hours)
5. **Phase 3.1** — Staff CRUD (add/edit/remove staff via admin UI)
6. **Phase 3.2** — Services CRUD (add/edit/remove/reorder services)
7. **Phase 3.3** — Gallery management (Supabase Storage integration)
8. **Phase 3.4** — Settings expansion (hours, social links, branding)

### Week 3 — Integration + Hardening (20-30 hours)
9. **Phase 4.1** — Stripe payment integration
10. **Phase 4.2** — SMS/Email notifications
11. **Phase 4.4** — Waitlist conversion
12. **Phase 4.3** — AI receptionist (optional, +additional)
13. **Phase 6** — Rate limiting, exclusion constraint, CI/CD

### Week 4 — Quality (16-24 hours)
14. **Phase 5** — Test infrastructure + unit/integration tests
15. **Phase 2 medium** — Polish remaining references
16. **Phase 2 low** — Final text sweep
17. **Phase 3.5** — Data isolation audit

---

## Quick-Start for a Developer

If you just want to genericize this fast (no new features), the minimal path is:

```bash
# 1. Set up env
cp .env .env.template
# Edit .env.template, remove secrets, add SALON_ID
echo ".env" >> .gitignore

# 2. Replace all "Nail Lounge" references
grep -rl "Nail Lounge" src/ supabase/ public/ | sort

# 3. Fix the BUSINESS constant in src/lib/salon.ts
#    Replace with fetchSalon() using SALON_ID env var

# 4. Fix __root.tsx SEO (JSON-LD, meta, og tags)
#    Make them template-driven from salon.name etc.

# 5. Fix seed.sql to be parameterized or removal-ready

# 6. Delete duplicate mynails/ directory
rm -rf mynails/
```

**Done in 4-6 hours.** Then deploy for a new salon:

```bash
# Create new salon record in DB
# Set SALON_ID env var in Vercel
# Deploy
bun run build
```

---

## Appendix: All Hardcoded Reference Files (by severity)

### BLOCKER
- `src/lib/salon.ts` (BUSINESS constant — entire business config)
- `src/routes/__root.tsx` (JSON-LD + meta + og tags)
- `src/routes/index.tsx` (hero, testimonial, contact info, social links)
- `src/routes/book.tsx` (confirmation text, step headers)
- `src/routes/appointments.tsx` (page title)
- `src/routes/services.tsx` (page title)
- `src/routes/gallery.tsx` (page title)
- `src/routes/gift-cards.tsx` (page title)
- `supabase/seed.sql` (salon UUID + content)
- `public/images/` (hardcoded image filenames)

### HIGH
- `src/routes/index.tsx` (hours, address, phone, email, social links)
- `src/routes/services.tsx` (CTA text)
- `src/routes/book.tsx` (multiple header texts)
- `src/routes/gift-cards.tsx` (body text)
- `src/routes/appointments.tsx` (body text)

### MEDIUM
- `src/lib/salon.ts` (fetchSalon .limit(1))
- `src/lib/booking.functions.ts` (no salon_id filter)
- `src/lib/admin.functions.ts` (linkSelfToFirstSalon .limit(1))
- `.env` (committed, no template)

### LOW
- Various component alt texts, loading states, 404 page, error boundaries
- sitemap.xml, robots.txt

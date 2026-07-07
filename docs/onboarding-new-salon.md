# Onboarding a New Salon

> **From zero to live.** A runbook for anyone who wants to spin up a branded online booking site for a salon using this template.

---

## Overview

This template (`~/mynails-generic`) is a **single-tenant** web app: one deployment = one salon. Every salon gets its own Supabase database, its own environment variables, and its own frontend — zero risk of data leaking between tenants.

**What you get out of the box:**

- Public site: home, services & pricing, gallery, gift cards, appointment booking
- Owner/admin console: dashboard, calendar, staff/services management, waitlist, commission ledger, settings, alerts
- Staff dashboard with system-enforced lockout modal (captures payment method, tip, service notes)
- Twilio SMS for booking confirmations + 1-5 automated rating follow-ups
- Rate-limited public booking endpoint
- Supabase backend: auth, row-level security, migrations, real-time data

---

## Prerequisites

| What you need                                                | Why                                     |
| ------------------------------------------------------------ | --------------------------------------- |
| A computer with `git`, `node` (≥22), `bun`                   | To clone and build the project          |
| A [Supabase](https://supabase.com) account (free tier works) | Database, auth, storage                 |
| (Optional) A [Twilio](https://twilio.com) account            | SMS confirmation messages + rating loop |
| (Optional) A [Resend](https://resend.com) account            | Email notifications                     |
| A domain name (e.g. `nails-by-ana.com`)                      | Where the site lives                    |

Time estimate: **2–4 hours** first time, faster on repeat.

---

## Step 1 — Create the repository

```bash
# Copy the template (not clone — you want a clean git history)
cp -r ~/mynails-generic ~/salons/ana-nails
cd ~/salons/ana-nails

# Start fresh
rm -rf .git
git init
git add -A
git commit -m "Initial commit — from mynails-generic template"
```

> ✏️ Replace `ana-nails` with the actual salon name. Keep it lowercase-hyphenated.

---

## Step 2 — Set up Supabase

### 2a. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard), click **New project**
2. **Organization** — choose your org (or create one)
3. **Name** — something like `Ana Nails Production`
4. **Database password** — generate and save it
5. **Region** — choose the one closest to the salon
6. **Pricing plan** — Free tier is fine to start

Wait a minute for the project to provision.

### 2b. Run the migrations

```bash
# Install supabase CLI (if you haven't)
brew install supabase/tap/supabase

# Link to your new project
supabase link --project-ref <your-project-ref>
# Get the ref from Settings → General → Reference ID

# Push the schema (creates all tables, RLS, and the exclusion constraint)
supabase db push
```

This creates all tables: `salons`, `staff`, `services`, `clients`, `bookings`, `commission_records`, `waitlist_entries`, `ai_call_logs`, `owner_alerts`, plus Row-Level Security policies, auth triggers, and the booking overlap exclusion constraint.

### 2c. Create the salon record

In the Supabase dashboard, go to **Table Editor** → table `salons`, click **Insert row**:

```json
{
  "id": "ana-nails-main",
  "name": "Ana's Nail Lounge",
  "address": "123 Main St, Springfield, IL 62701",
  "phone": "+12175551234",
  "business_hours": {},
  "holiday_schedule": {},
  "created_at": "now()"
}
```

The `id` field is the **SALON_ID** — keep it short, stable, and unique. You'll never change it.

> 💡 **Pro tip:** After deployment, you can add staff and services from the admin Settings page — no need to insert them manually.

### 2d. Set up Auth

Go to **Authentication → Providers** and make sure **Email** is enabled (it's on by default). Turn off "Confirm email" for the owner account if you don't want the email-verification dance during setup.

---

## Step 3 — Configure environment

Copy the template and fill it in:

```bash
cp .env.template .env
```

Edit `.env` with the salon's details:

```ini
# ─── Required ────────────────────────────────────────────
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-project-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_APP_URL=https://nailsbyana.com
VITE_SALON_ID=ana-nails-main
VITE_SALON_NAME=Ana's Nail Lounge
VITE_SALON_ADDRESS=123 Main St, Springfield, IL 62701
VITE_SALON_PHONE=+12175551234

# ─── Branding ────────────────────────────────────────────
VITE_BRAND_PRIMARY_COLOR=#5B2C6F
VITE_BRAND_SECONDARY_COLOR=#E8B4F8
VITE_OG_IMAGE=https://nailsbyana.com/og-image.jpg

# ─── Social (optional) ───────────────────────────────────
VITE_SALON_EMAIL=ana@nailsbyana.com
VITE_SALON_MAPS_URL=https://maps.app.goo.gl/xxxx
VITE_SALON_MAPS_EMBED=https://www.google.com/maps/embed?pb=xxxx
VITE_SALON_INSTAGRAM=https://instagram.com/anasnails
VITE_SALON_FACEBOOK=https://facebook.com/anasnails
VITE_SALON_TIKTOK=
VITE_SALON_YELP=
VITE_SALON_BOOKSY=

# ─── Admin ───────────────────────────────────────────────
VITE_ADMIN_EMAIL=ana@nailsbyana.com
VITE_ADMIN_ONBOARD=true

# ─── Twilio (for SMS confirmations + rating loop, optional) ─────
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
GOOGLE_REVIEW_URL=https://g.page/r/xxxx/review

# ─── Feature Flags ──────────────────────────────────────
VITE_ALLOW_SEED_DATA=false
```

### Key env var rules

| Var                                                                | Rule                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `VITE_SALON_ID`                                                    | Must match the `id` column in the `salons` table. Never change after launch.                     |
| `VITE_SALON_NAME`                                                  | Appears in the header, footer, page titles, OG tags, JSON-LD schema. Keep it short.              |
| `VITE_ADMIN_ONBOARD`                                               | Set to `true` to allow the first admin sign-in to auto-link to the salon. Turn to `false` after. |
| `VITE_OG_IMAGE`                                                    | 1200×630px JPEG/PNG. Hosted somewhere accessible (R2, Supabase storage, etc).                    |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` | Required for SMS confirmations + rating loop. Omit to skip SMS entirely.                         |
| `GOOGLE_REVIEW_URL`                                                | Full URL to the salon's Google review page. Used for high-rating (4-5) SMS follow-ups.           |

> **Two key sets of Supabase credentials:**
>
> - `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — client-side anon key (safe in browser)
> - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — server-side admin key (never exposed to client)

---

## Step 4 — Test locally

```bash
bun install
bun dev
```

Open `http://localhost:5173` — you should see the salon's name in the header. Walk through:

- [ ] Home page — name, tagline, address all correct
- [ ] Services page — shows pricing (seed data or empty state)
- [ ] Gallery — placeholder images load
- [ ] Booking flow — pick a service, staff, time, confirm (booking created directly as confirmed)
- [ ] Admin — click "Admin" in the footer, sign in with email, should auto-link your account
- [ ] Settings → Staff — add staff members
- [ ] Settings → Services — add services with pricing
- [ ] Settings → Hours — set open/close times per day
- [ ] Staff modal flow — book an appointment, mark as completed in admin, log in as staff, verify forced modal with payment method/tip/notes fields
- [ ] If Twilio is configured — verify SMS receipt after booking and test 1-5 rating reply

> **Troubleshooting:** If the site shows "Your Salon Name" or empty fields, double-check your `.env` file is loading (look in the browser console for Vite env warnings).

---

## Step 5 — Customize content

### Photos

Replace the gallery images in `src/routes/gallery.tsx` — look for the `import` statements at the top pointing to local assets. Swap in real salon photos.

Same for the hero image on the home page (look for the hero section in `src/routes/index.tsx`).

### Services & Pricing

**Use the admin Settings page** to add and manage services: navigate to `/admin`, go to **Settings → Services**. You can add services with name, duration, price, category, description, and optional deposit amount. No database editing needed.

### Staff

**Use the admin Settings page** to add staff members: **Settings → Staff**. Add name, title, bio, commission percentage, hourly rate, and image URL. You can toggle active/inactive and soft-delete.

### Hours of operation

**Use the admin Settings page** to set business hours: **Settings → Hours**. Set open and close times for each day of the week. Leave blank to mark a day as closed.

---

## Step 6 — Deploy

### Option A: Vercel (recommended, 5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

On first deploy, Vercel will ask you to link the project. During the setup, add all the environment variables from your `.env` file via `vercel env add`.

Then set up the domain:

```
vercel domains add nailsbyana.com
```

Configure the DNS A record at your domain registrar to point to `76.76.21.21`.

### Option B: Netlify

Push to GitHub, connect repo in Netlify dashboard:

- **Build command:** `bun run build`
- **Publish directory:** `dist`
- **Environment variables:** Add all from `.env`

Set up custom domain: Netlify will give you a DNS target.

### Option C: Cloudflare Pages

Same pattern as Netlify — connect repo, set build command/output directory, add env vars, set custom domain.

---

## Step 7 — Post-deployment checklist

- [ ] **Twilio (optional)** — buy a phone number, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` and `GOOGLE_REVIEW_URL` in env. Configure the Twilio SMS webhook URL to point to `{APP_URL}/api/twilio-webhook` (e.g. `https://nailsbyana.com/api/twilio-webhook`).
- [ ] **OG image** — verify social share preview looks right on ogdebug.com.
- [ ] **Admin (first sign-in)** — sign in at `/admin`. With `VITE_ADMIN_ONBOARD=true`, your account should auto-link.
- [ ] **Add staff** — go to Settings → Staff, add at least one staff member.
- [ ] **Add services** — go to Settings → Services, add services with prices.
- [ ] **Set hours** — go to Settings → Hours, set open/close times per day.
- [ ] **Book a test appointment** — go through the full flow. Booking is created as confirmed directly.
- [ ] **Test staff modal** — mark a booking as completed, log in as the assigned staff, verify the forced modal appears with payment method, tip, and notes fields. Submit and verify the modal dismisses.
- [ ] **Verify SMS (if configured)** — after booking, confirm the SMS arrives with booking details. After staff submits modal, verify rating SMS arrives.
- [ ] **Run tests** — `bun run test` confirms rate limiting and core logic work.

---

## Maintaining

### Per-salon isolation rule

Remember: **every database query must filter by `SALON_ID`**. The template enforces this everywhere — never write raw queries that skip the salon filter.

### Rolling back

If a deploy breaks:

```bash
# Vercel
vercel rollback

# Netlify
# Go to Deploys → last known good → click "Publish"

# Cloudflare
# Go to Deployments → find last good build → "Roll back to this"
```

### Onboarding another salon

Repeat steps 1–7 with a fresh copy of the template and a new Supabase project. Each salon = its own deployment = its own database — complete isolation.

---

## Architecture quick reference

```
Frontend (Vite + React + TanStack Router)
  ├── Public pages (home, services, gallery, gift cards, book, booking-confirmed)
  ├── Admin pages (dashboard, calendar, commissions, alerts, waitlist, floor, settings)
  ├── Staff page (staff dashboard with forced lockout modal)
  └── env.ts — all salon-specific config in one place

Supabase
  ├── 11 tables + RLS policies + auth hooks + exclusion constraint
  ├── Storage for gallery images (optional)
  └── Realtime for live booking updates

Integrations (gated via env)
  ├── Twilio — SMS booking confirmations + 1-5 rating loop (+ owner alerts for low ratings)
  └── AI endpoints — receptionist / call logging (stub)
```

---

## File you'll touch most

| File                                            | What it controls                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `.env`                                          | The actual secrets per deployment                                 |
| `src/lib/env.ts`                                | All salon-branded values (name, address, phone, social, OG image) |
| `src/routes/index.tsx`                          | Hero section, "about us" text, CTAs                               |
| `src/routes/gallery.tsx`                        | Gallery images and layout                                         |
| `src/routes/_authenticated/-admin-settings.tsx` | Staff CRUD, Services CRUD, Hours editor (manage via UI, not file) |

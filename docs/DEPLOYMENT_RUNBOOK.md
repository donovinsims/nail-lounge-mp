# Deployment Runbook — MyNails Generic

> Deploying a new salon instance of the TanStack Start + Supabase template.

## Deployment Architecture

- **Frontend / SSR:** TanStack Start (Nitro server engine targeting Vercel/Cloudflare)
- **Database:** Supabase PostgreSQL
- **SMS:** Twilio (optional — booking confirmations + 1-5 rating loop)
- **Email:** Resend (optional)
- **Analytics:** Umami Cloud (optional)
- **CI/CD:** GitHub Actions (push / PR to `main`)

---

## Environment Variables

### Required — app won't start without these

| Variable                        | Where to set                  | Description                             |
| ------------------------------- | ----------------------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`             | Cloudflare Pages env          | Supabase project URL                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Cloudflare Pages env          | Supabase anon key                       |
| `SUPABASE_URL`                  | Cloudflare Pages env (secret) | Same as `VITE_SUPABASE_URL`             |
| `SUPABASE_PUBLISHABLE_KEY`      | Cloudflare Pages env (secret) | Same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY`     | Cloudflare Pages env (secret) | For admin / server-only operations      |
| `VITE_SALON_ID`                 | Cloudflare Pages env          | UUID of the salon row in the database   |
| `VITE_APP_URL`                  | Cloudflare Pages env          | Public URL of this deployment           |

### Strongly Recommended

| Variable             | Description                                     |
| -------------------- | ----------------------------------------------- |
| `VITE_SALON_NAME`    | Salon display name (fallback: "My Salon")       |
| `VITE_SALON_PHONE`   | Salon phone number for display (fallback: none) |
| `VITE_SALON_ADDRESS` | Salon address for display (fallback: none)      |
| `VITE_OG_IMAGE_URL`  | OG image for social sharing (fallback: generic) |

### Optional — features gate on these

**Twilio (SMS notifications + 1-5 rating loop):**

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID                 |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token                  |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164 format) |

**Resend (email notifications):**

| Variable         | Description    |
| ---------------- | -------------- |
| `RESEND_API_KEY` | Resend API key |

**Umami (analytics):**

| Variable                | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `VITE_UMAMI_WEBSITE_ID` | Umami website UUID                                 |
| `VITE_UMAMI_HOST`       | Umami host URL (default: `https://cloud.umami.is`) |

### Development Helpers

| Variable               | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `VITE_ALLOW_SEED_DATA` | Set to `"true"` to enable the seed data endpoint (dev only) |

---

## Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run migrations** — apply EVERY file in `supabase/migrations/` in filename (timestamp) order. As of 2026-07-07 that is 11 files:
   - `20260617030841_*.sql` — initial schema + RLS + triggers + seed
   - `20260617062401_*.sql` — staff columns + full seed
   - `20260617104256_*.sql` — security cleanup
   - `20260617140532_*.sql` — RPC bookings read + column grants
   - `20260618180000_add_staff_auth_user_id_unique.sql`
   - `20260619000000_add_booking_overlap_constraint.sql`
   - `20260620000000_add_stripe_session_id_to_bookings.sql`
   - `20260621000000_pivot_remove_stripe_add_modal_fields.sql`
   - `20260707000000_add_client_phone_to_bookings.sql`
   - `20260707000001_rate_limits.sql`
   - `20260707000002_available_slots_rpc.sql`

   Don't hand-pick — the list above will drift as new migrations land; the folder is the source of truth.

3. **Insert a salon row:**
   - `id` = the UUID you set as `VITE_SALON_ID`
   - `name`, `phone`, `address`, `business_hours` (JSON), `holiday_schedule` (JSON)
4. **Enable Google OAuth** in Supabase Auth settings.
5. **Configure site URL and redirect URLs** in Supabase Auth settings so OAuth callbacks work.

---

## Twilio Setup (if used)

1. Create a Twilio account at [twilio.com](https://twilio.com).
2. Buy or provision a phone number with SMS capability.
3. Configure the SMS webhook URL in your Twilio console to point at `<YOUR_APP_URL>/api/twilio-webhook`.
4. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` to the environment.

---

## Deployment

This deployment has no payment processing dependency — all payments are handled in-store. No Stripe account or configuration is needed.

### Vercel Deployment

1. **Connect your GitHub repo** to Vercel.
2. **Build command:** `NITRO_PRESET=vercel vite build` (set in `vercel.json`)
3. **Build output directory:** `dist/`
4. **Add all environment variables** — mark secrets as **Encrypted**.
5. **Deploy** (first deploy or automatic on push to `main`).

> **Note:** Vercel auto-detects npm (not Bun) because `package-lock.json` takes priority over `bun.lock`. No custom `installCommand` is needed — `vercel.json` omits it. The `prepare` script gracefully handles missing `husky` on CI.

### Cloudflare Pages Deployment

1. **Connect your GitHub repo** to Cloudflare Pages.
2. **Build command:** `bun run build`
3. **Build output directory:** `dist/`
4. **Add all environment variables** — mark secrets as **Encrypted**.
5. **Deploy** (first deploy or automatic on push to `main`).

---

## Post-Deployment Checklist

1. **Visit the app** — verify it loads with the correct salon name.
2. **Go to `/auth`** — verify sign-in works.
3. **Log in as the owner** → navigate to **Settings**.
4. **Add staff members** (name, role, working hours, color).
5. **Add services** (name, duration, price, category).
6. **Set business hours** and holiday schedule.
7. **Book a test appointment** via the public booking flow.
8. **Test the staff completion modal** — mark a booking as completed, log in as the assigned staff member, verify the forced modal appears with payment method, tip, and notes fields.
9. **If Twilio is enabled:** verify an SMS is received after booking, and test the 1-5 rating reply flow.
10. **Run tests** — `bun run test` confirms rate limiting and core logic work.

---

## Rollback Plan

If a deployment breaks:

1. **Vercel/Cloudflare Pages:** go to the previous successful deployment and click **"Rollback"** or **"Set as production"**.
2. **Database issues:** restore from a Supabase backup or run a rollback migration.
3. **Immediate fix:** revert the offending commit and redeploy.

---

## Security Notes

- **Server-only env vars** (non-`VITE_` prefix) must never be in client bundles — Vercel/Cloudflare Encrypted secrets handle this automatically when used server-side.
- **Rate limiting on `createPublicBooking`:** 3 requests per 5 minutes per phone number.
- **AI endpoint stubs** require a shared secret header for validation.
- **All admin operations** require an authenticated Supabase session with the appropriate RLS policy.
- **Staff modal** is system-enforced — no admin toggle to disable accountability.

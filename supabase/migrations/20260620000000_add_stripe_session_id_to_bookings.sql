-- Store the Stripe Checkout session ID so we can reconcile payments later
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON public.bookings (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

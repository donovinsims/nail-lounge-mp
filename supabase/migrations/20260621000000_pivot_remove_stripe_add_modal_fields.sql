-- Pivot: Remove Stripe/deposit columns, add staff modal + Twilio rating fields
-- Workstream B of the Strategic Pivot Plan
-- Idempotent version: safe to re-run

-- Drop Stripe/deposit columns (cleanup)
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_paid;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_session_id;

-- Create payment_method enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('Credit/Debit', 'Cash', 'Venmo', 'Cash App');
  END IF;
END $$;

-- Add columns if they don't exist (staff completion modal + Twilio rating)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tip_amount') THEN
    ALTER TABLE bookings ADD COLUMN tip_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_method') THEN
    ALTER TABLE bookings ADD COLUMN payment_method payment_method;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='service_notes') THEN
    ALTER TABLE bookings ADD COLUMN service_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='completed_at') THEN
    ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='client_rating') THEN
    ALTER TABLE bookings ADD COLUMN client_rating SMALLINT CHECK (client_rating >= 1 AND client_rating <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='rating_sent_at') THEN
    ALTER TABLE bookings ADD COLUMN rating_sent_at TIMESTAMPTZ;
  END IF;
END $$;

-- Owner alerts table
CREATE TABLE IF NOT EXISTS owner_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  client_phone TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 3),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on owner_alerts
ALTER TABLE owner_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Salon members can view owner_alerts') THEN
    CREATE POLICY "Salon members can view owner_alerts"
      ON owner_alerts FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM bookings b
          JOIN staff s ON s.salon_id = b.salon_id
          WHERE b.id = owner_alerts.booking_id
            AND s.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Indexes (IF NOT EXISTS supported since PG 9.5)
CREATE INDEX IF NOT EXISTS idx_bookings_completed_at_null ON bookings (staff_id) WHERE completed_at IS NULL AND status = 'completed';
CREATE INDEX IF NOT EXISTS idx_bookings_rating_sent_at_null ON bookings (id) WHERE rating_sent_at IS NULL AND completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_alerts_unacknowledged ON owner_alerts (created_at DESC) WHERE acknowledged_at IS NULL;

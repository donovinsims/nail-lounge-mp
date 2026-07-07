-- Pivot: Remove Stripe/deposit columns, add staff modal + Twilio rating fields
-- Workstream B of the Strategic Pivot Plan

-- Drop Stripe/deposit columns (cleanup)
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_paid;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_session_id;

-- New enum for in-store payment methods captured in staff modal
CREATE TYPE payment_method AS ENUM ('Credit/Debit', 'Cash', 'Venmo', 'Cash App');

-- New columns for staff completion modal (accountability lockout)
ALTER TABLE bookings ADD COLUMN tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN payment_method payment_method;
ALTER TABLE bookings ADD COLUMN service_notes TEXT;
ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMPTZ;

-- New columns for Twilio 1-5 rating loop
ALTER TABLE bookings ADD COLUMN client_rating SMALLINT CHECK (client_rating >= 1 AND client_rating <= 5);
ALTER TABLE bookings ADD COLUMN rating_sent_at TIMESTAMPTZ;

-- Owner alerts table for low ratings (1-3)
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

-- Only salon members via RLS can see their alerts
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

-- Index for quick lookups
CREATE INDEX idx_bookings_completed_at_null ON bookings (staff_id) WHERE completed_at IS NULL AND status = 'completed';
CREATE INDEX idx_bookings_rating_sent_at_null ON bookings (id) WHERE rating_sent_at IS NULL AND completed_at IS NOT NULL;
CREATE INDEX idx_owner_alerts_unacknowledged ON owner_alerts (created_at DESC) WHERE acknowledged_at IS NULL;

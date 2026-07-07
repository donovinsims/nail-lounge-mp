-- Add client_phone column to bookings for Twilio SMS lookup.
-- Denormalized from clients.phone so SMS flows work even if client record changes.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Auto-populate client_phone from clients.phone on INSERT or client_id change
CREATE OR REPLACE FUNCTION sync_client_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.client_phone := (SELECT phone FROM clients WHERE id = NEW.client_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_client_phone ON bookings;
CREATE TRIGGER trg_sync_client_phone
  BEFORE INSERT OR UPDATE OF client_id ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_client_phone();

-- Backfill any existing bookings that lack client_phone
UPDATE bookings b SET client_phone = c.phone
FROM clients c
WHERE b.client_id = c.id AND b.client_phone IS NULL;

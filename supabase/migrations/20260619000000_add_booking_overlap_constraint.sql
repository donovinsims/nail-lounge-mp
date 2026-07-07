-- Prevent double-booking: no two confirmed/completed bookings may overlap
-- for the same staff member at the same time.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  staff_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
WHERE (status IN ('confirmed', 'completed'));

-- Revoke overly-broad anon SELECT on bookings.
-- Migration 4 (20260617030841) accidentally granted SELECT on the entire
-- bookings table to anon (line 145) instead of specific columns.
-- RLS provides default-deny protection, but removing the table-level GRANT
-- adds defense-in-depth against accidental PII exposure.

REVOKE ALL ON public.bookings FROM anon;

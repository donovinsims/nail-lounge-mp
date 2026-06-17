
-- 1) Bookings: remove public read; provide a narrow availability RPC
DROP POLICY IF EXISTS "Public read bookings for availability" ON public.bookings;

CREATE OR REPLACE FUNCTION public.get_busy_slots(
  p_staff_id uuid,
  p_day_start timestamptz,
  p_day_end timestamptz
)
RETURNS TABLE (
  start_time timestamptz,
  end_time timestamptz,
  buffer_after_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_time, b.end_time, COALESCE(s.buffer_after_minutes, 0)
  FROM public.bookings b
  LEFT JOIN public.services s ON s.id = b.service_id
  WHERE b.staff_id = p_staff_id
    AND b.status IN ('confirmed','completed')
    AND b.start_time >= p_day_start
    AND b.start_time <= p_day_end;
$$;

REVOKE ALL ON FUNCTION public.get_busy_slots(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, timestamptz, timestamptz) TO anon, authenticated;

-- 2) Salons: hide internal financial config from anon (public can still see name/address/hours)
REVOKE SELECT ON public.salons FROM anon;
GRANT SELECT (id, name, address, phone, business_hours, holiday_schedule, created_at) ON public.salons TO anon;

-- 3) Staff: hide auth_user_id, pin, role from anon (display fields remain public)
REVOKE SELECT ON public.staff FROM anon;
GRANT SELECT (
  id, salon_id, name, title, bio, specialties, avatar_url, avatar_color,
  sort_order, working_hours, is_active, created_at
) ON public.staff TO anon;

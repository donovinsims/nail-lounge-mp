-- Prevent duplicate staff records per auth user
-- This avoids the infinite loading bug when getMyStaff() finds >1 row
CREATE UNIQUE INDEX IF NOT EXISTS staff_auth_user_id_key ON public.staff (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Revoke EXECUTE from public/anon/authenticated on SECURITY DEFINER functions
-- that should only ever be invoked by triggers (not directly via the API).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.flag_waitlist_on_cancel() FROM PUBLIC, anon, authenticated;

-- RLS-helper SECURITY DEFINER functions (has_role, is_salon_member,
-- current_user_salon_ids) are intentionally callable by authenticated users:
-- they are invoked from inside RLS policies and only read rows scoped to
-- auth.uid(). They are safe to remain executable.
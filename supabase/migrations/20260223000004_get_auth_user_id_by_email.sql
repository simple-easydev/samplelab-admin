-- =====================================================
-- Get auth user id by email (for customer sign-up workaround)
-- =====================================================
-- Allows Edge Function to link an existing auth user (e.g. admin)
-- to a new customer profile when they "sign up" as customer with same email.
-- Only callable by service_role; restrict in RLS or use from Edge Function only.
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM auth.users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email))
  LIMIT 1;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(TEXT) TO service_role;

COMMENT ON FUNCTION public.get_auth_user_id_by_email(TEXT) IS
  'Returns auth.users.id for the given email. Used by sign-up Edge Function to link existing auth user to customer profile.';

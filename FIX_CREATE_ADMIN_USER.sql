-- =====================================================
-- Run this in Supabase SQL Editor to fix
-- "Database error creating new user" on invite setup
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_admin_user_record(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'content_editor'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin, role)
  VALUES (p_id, p_email, p_name, true, p_role);
END;
$$;

-- =====================================================
-- Done. Try the invite setup again.
-- =====================================================

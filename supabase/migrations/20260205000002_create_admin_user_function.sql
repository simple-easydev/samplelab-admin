-- =====================================================
-- Create function to insert admin user (bypasses RLS)
-- =====================================================
-- Use this when creating a new admin from invite - avoids
-- "Database error creating new user" from RLS/triggers.
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

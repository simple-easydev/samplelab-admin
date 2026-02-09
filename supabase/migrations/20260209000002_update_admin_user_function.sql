-- =====================================================
-- Update create_admin_user_record Function
-- =====================================================
-- Drop the old function first to avoid conflicts
-- =====================================================

-- Drop the old function (4 parameters)
DROP FUNCTION IF EXISTS public.create_admin_user_record(UUID, TEXT, TEXT, TEXT);

-- Create new version with invited_by parameter (5 parameters)
CREATE OR REPLACE FUNCTION public.create_admin_user_record(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'content_editor',
  p_invited_by UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin, role, status, invited_by)
  VALUES (
    p_id, 
    p_email, 
    p_name, 
    true, 
    p_role::user_role,
    'active'::user_status,  -- New users are active once they complete setup
    p_invited_by
  );
END;
$$;

-- Create a function to update last_login when user logs in
CREATE OR REPLACE FUNCTION public.update_user_last_login(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_login = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_admin_user_record TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_last_login TO authenticated;

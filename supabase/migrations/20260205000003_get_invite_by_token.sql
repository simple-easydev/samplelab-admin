-- Allow unauthenticated invite validation via RPC (no Express/Edge needed for read)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token TEXT)
RETURNS TABLE (email TEXT, role TEXT, expires_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT i.email, i.role, i.expires_at
  FROM public.admin_invites i
  WHERE i.token = p_token AND i.used = false;
$$;

-- Anon can call this (used on invite setup page before login)
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO authenticated;

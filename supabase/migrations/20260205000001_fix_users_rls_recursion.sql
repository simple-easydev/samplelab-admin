-- =====================================================
-- Fix: Infinite recursion in users table RLS policies
-- =====================================================
-- Policies that check "SELECT FROM users WHERE is_admin" cause
-- recursion. Use a SECURITY DEFINER function to break the cycle.
-- =====================================================

-- Function that checks if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Recreate using the function (no recursion)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (public.is_current_user_admin());

-- Allow user to insert their own row (needed for invite setup / auth triggers)
DROP POLICY IF EXISTS "Users can insert own row" ON users;
CREATE POLICY "Users can insert own row" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

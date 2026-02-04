-- =====================================================
-- Fix: Allow new user to be inserted into public.users
-- =====================================================
-- Run this in Supabase SQL Editor if setup returns
-- "Database error creating new user"
--
-- This policy lets a user insert their own row (id = auth.uid()).
-- Needed when Supabase Auth triggers run on signup or when
-- the app creates the row in a context that uses RLS.
-- =====================================================

-- Allow user to insert their own row (e.g. on first signup/invite setup)
DROP POLICY IF EXISTS "Users can insert own row" ON users;
CREATE POLICY "Users can insert own row" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Done. Try the invite setup flow again.
-- =====================================================

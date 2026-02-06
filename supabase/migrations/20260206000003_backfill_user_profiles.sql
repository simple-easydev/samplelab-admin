-- =====================================================
-- BACKFILL USER PROFILES FOR EXISTING AUTH USERS
-- =====================================================
-- This migration creates user profiles for any existing
-- auth.users that don't have a corresponding public.users record

INSERT INTO public.users (id, email, name, is_admin, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  FALSE as is_admin,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

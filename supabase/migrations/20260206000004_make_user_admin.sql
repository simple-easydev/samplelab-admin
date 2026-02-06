-- =====================================================
-- MAKE YOUR USER AN ADMIN
-- =====================================================
-- Run this after logging in to make yourself an admin
-- Replace 'your-email@example.com' with your actual email

UPDATE public.users
SET 
  is_admin = TRUE,
  role = 'full_admin'
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, is_admin, role FROM public.users WHERE email = 'your-email@example.com';

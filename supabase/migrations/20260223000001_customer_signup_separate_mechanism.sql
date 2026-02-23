-- =====================================================
-- CUSTOMER SIGN-UP: SEPARATE MECHANISM FROM ADMIN USERS
-- =====================================================
-- - customers.user_id references auth.users (not users) so customers
--   can exist without a row in public.users.
-- - handle_new_user() creates either public.users (admin path) or
--   public.customers (customer path) based on raw_user_meta_data.is_customer.
-- =====================================================

-- 1. Point customers.user_id at auth.users so customers don't require a users row
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

ALTER TABLE customers
  ADD CONSTRAINT customers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Unique email on customers for duplicate check in sign-up
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email ON customers (LOWER(email));

-- 3. handle_new_user: create users row (admin) OR customers row (customer), not both
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'is_customer') = 'true' THEN
    -- Customer sign-up (e.g. from sign-up Edge Function): only create customers row
    INSERT INTO public.customers (id, user_id, email, name, subscription_tier, credit_balance, status)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      LOWER(TRIM(NEW.email)),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), NEW.email),
      'free',
      0,
      'active'
    );
  ELSE
    -- Admin path (invite flow or legacy): create public.users row
    INSERT INTO public.users (id, email, name, is_admin)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      FALSE
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

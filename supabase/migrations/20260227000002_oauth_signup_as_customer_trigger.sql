-- =====================================================
-- TREAT OAUTH (GOOGLE) SIGNUPS AS CUSTOMERS
-- =====================================================
-- When a user signs up via Google (or other OAuth), Supabase creates the auth
-- user server-side so we cannot set options.data (is_customer, real_email) from
-- the client. This trigger treats OAuth signups as customers using
-- raw_app_meta_data.provider so the customer row is created at signup time.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_customer_path boolean;
  customer_email text;
  customer_name text;
BEGIN
  -- Customer path: explicit is_customer in metadata (email sign-up) OR OAuth provider (e.g. Google)
  is_customer_path := (NEW.raw_user_meta_data->>'is_customer') = 'true'
    OR (NEW.raw_app_meta_data->>'provider') IN ('google', 'google_oauth2', 'apple', 'github');

  IF is_customer_path THEN
    customer_email := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'real_email', NEW.email)));
    customer_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NEW.raw_user_meta_data->>'full_name',
      customer_email
    );
    INSERT INTO public.customers (id, user_id, email, name, subscription_tier, credit_balance, status)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      customer_email,
      customer_name,
      'free',
      0,
      'active'
    );
  ELSE
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

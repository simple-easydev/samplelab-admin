-- =====================================================
-- REMOVE CUSTOMER_ PREFIX: do not modify auth.users email for OAuth
-- =====================================================
-- Replaces handle_new_user to remove the logic that set auth.users.email
-- to "customer_<email>" and real_email in metadata for OAuth sign-ups.
-- Auth email stays as-is (e.g. Google email); customer row still created.
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

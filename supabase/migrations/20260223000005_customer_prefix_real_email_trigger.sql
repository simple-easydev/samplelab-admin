-- =====================================================
-- CUSTOMER AUTH: prefix email in auth, store real email in customers
-- =====================================================
-- Customer sign-up uses auth email customer_<email> (different password from admin).
-- Trigger stores real email in public.customers via raw_user_meta_data.real_email.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'is_customer') = 'true' THEN
    INSERT INTO public.customers (id, user_id, email, name, subscription_tier, credit_balance, status)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'real_email', NEW.email))),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'real_email', NEW.email)))),
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

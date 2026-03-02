-- RPC: Return active plan tiers (Stripe products) for pricing/onboarding.
-- Optional filter: when visible_onboarding = true, only plans with visible_onboarding = true.
-- Public (anon + authenticated); plans are non-sensitive.

CREATE OR REPLACE FUNCTION public.get_stripe_products(visible_onboarding boolean DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'plans', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(pt) ORDER BY pt.sort_order)
        FROM plan_tiers pt
        WHERE pt.is_active = true
          AND (NOT (COALESCE(visible_onboarding, false) = true) OR pt.visible_onboarding = true)
      ),
      '[]'::jsonb
    )
  );
$$;

COMMENT ON FUNCTION public.get_stripe_products(boolean) IS
  'Returns active plan tiers as { plans: [...] }. Optional arg visible_onboarding: when true, only plans with visible_onboarding = true (e.g. for onboarding). Call via supabase.rpc(''get_stripe_products'', { visible_onboarding: true }) or supabase.rpc(''get_stripe_products'').';

GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO service_role;

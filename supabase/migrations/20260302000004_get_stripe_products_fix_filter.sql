-- Fix get_stripe_products: ensure visible_onboarding filter is applied when arg is true.
-- (Original migration 20260302000003 may have been applied before the fix; this re-applies the correct logic.)

CREATE OR REPLACE FUNCTION public.get_stripe_products(visible_onboarding boolean DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_plans jsonb;
BEGIN
  IF (visible_onboarding IS NOT DISTINCT FROM true) THEN
    -- Only plans with visible_onboarding = true
    SELECT COALESCE(jsonb_agg(to_jsonb(pt) ORDER BY pt.sort_order), '[]'::jsonb)
      INTO result_plans
      FROM plan_tiers pt
      WHERE pt.is_active = true AND pt.visible_onboarding = true;
  ELSE
    -- All active plans
    SELECT COALESCE(jsonb_agg(to_jsonb(pt) ORDER BY pt.sort_order), '[]'::jsonb)
      INTO result_plans
      FROM plan_tiers pt
      WHERE pt.is_active = true;
  END IF;

  RETURN jsonb_build_object('plans', result_plans);
END;
$$;

COMMENT ON FUNCTION public.get_stripe_products(boolean) IS
  'Returns active plan tiers as { plans: [...] }. Optional arg visible_onboarding: when true, only plans with visible_onboarding = true (e.g. for onboarding). Call via supabase.rpc(''get_stripe_products'', { visible_onboarding: true }) or supabase.rpc(''get_stripe_products'').';

GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_products(boolean) TO service_role;

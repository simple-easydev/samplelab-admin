-- credit_cost_from_sample_type reads public.app_settings. RLS only allows admins to
-- SELECT app_settings, so non-admin callers of get_all_samples saw NULL settings and
-- always got fallback costs (1 / 2). Run this function as definer so rule values apply
-- to all RPC users (catalog / library).

CREATE OR REPLACE FUNCTION public.credit_cost_from_sample_type(p_type text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE
      WHEN public.is_one_shot_sample_type(p_type) THEN (
        SELECT CASE
          WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
          ELSE NULL
        END
        FROM public.app_settings a
        WHERE a.key = 'credit_rules.one_shots'
        LIMIT 1
      )
      ELSE (
        SELECT CASE
          WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
          ELSE NULL
        END
        FROM public.app_settings a
        WHERE a.key = 'credit_rules.loops_compositions'
        LIMIT 1
      )
    END,
    CASE
      WHEN public.is_one_shot_sample_type(p_type) THEN 1
      ELSE 2
    END
  )::integer;
$$;

COMMENT ON FUNCTION public.credit_cost_from_sample_type(text) IS
  'Credit cost from app_settings (SECURITY DEFINER so RLS does not hide rules from non-admins).';

REVOKE ALL ON FUNCTION public.credit_cost_from_sample_type(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_cost_from_sample_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_cost_from_sample_type(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_cost_from_sample_type(text) TO anon;

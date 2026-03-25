-- RPC: Fetch current user's credit activity ledger (paged, newest first).
-- Frontend: supabase.rpc('get_my_credit_activity', { p_limit: 50, p_offset: 0 })

CREATE OR REPLACE FUNCTION public.get_my_credit_activity(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH me AS (
    SELECT c.id AS customer_id, COALESCE(c.credit_balance, 0)::integer AS current_balance
    FROM public.customers c
    WHERE c.user_id = auth.uid()
    LIMIT 1
  ),
  items AS (
    SELECT
      ca.id,
      ca.delta,
      ca.balance_before,
      ca.balance_after,
      ca.activity_type,
      ca.source_type,
      ca.source_ref,
      ca.note,
      ca.metadata,
      ca.sample_id,
      ca.subscription_id,
      ca.actor_user_id,
      ca.idempotency_key,
      ca.created_at
    FROM public.credit_activity ca
    JOIN me ON me.customer_id = ca.customer_id
    ORDER BY ca.created_at DESC
    LIMIT GREATEST(0, LEAST(COALESCE(p_limit, 50), 200))
    OFFSET GREATEST(0, COALESCE(p_offset, 0))
  )
  SELECT jsonb_build_object(
    'current_balance', COALESCE((SELECT current_balance FROM me), 0),
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(i)) FROM items i), '[]'::jsonb)
  );
$$;

COMMENT ON FUNCTION public.get_my_credit_activity(integer, integer) IS
  'Returns current user credit ledger entries (paged) and current balance. Respects RLS on credit_activity.';

GRANT EXECUTE ON FUNCTION public.get_my_credit_activity(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_credit_activity(integer, integer) TO service_role;

-- RPC: Return current user's customer and active/trialing subscription in one response.
-- Used by frontend once per session (or when needed); no request body — user from JWT (auth.uid()).

CREATE OR REPLACE FUNCTION public.get_my_billing_info()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'customer', (
      SELECT to_jsonb(c) FROM customers c
      WHERE c.user_id = auth.uid()
      LIMIT 1
    ),
    'subscription', (
      SELECT to_jsonb(s) FROM subscriptions s
      WHERE s.customer_id = (SELECT id FROM customers WHERE user_id = auth.uid() LIMIT 1)
        AND s.stripe_status IN ('active', 'trialing')
      ORDER BY s.created_at DESC
      LIMIT 1
    )
  );
$$;

COMMENT ON FUNCTION public.get_my_billing_info() IS
  'Returns current user billing info: customer row (or null) and latest active/trialing subscription (or null). Call via supabase.rpc(''get_my_billing_info'').';

GRANT EXECUTE ON FUNCTION public.get_my_billing_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_billing_info() TO service_role;

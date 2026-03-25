-- =====================================================
-- CREDIT ACTIVITY LEDGER
-- =====================================================
-- Tracks every credit increase/decrease event per customer.
-- Keep this table append-only for reliable audit trails.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.credit_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  -- Signed delta: positive = credit added, negative = credit deducted
  delta integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,

  -- What happened (business event type)
  activity_type text NOT NULL CHECK (
    activity_type IN (
      'download_charge',
      'manual_adjustment',
      'subscription_grant',
      'purchase_topup',
      'refund',
      'reversal',
      'expiration'
    )
  ),

  -- Who/what initiated the change
  source_type text NOT NULL CHECK (
    source_type IN ('system', 'admin', 'customer', 'stripe', 'api')
  ),
  source_ref text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Optional entity links for faster joins and traceability
  sample_id uuid REFERENCES public.samples (id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions (id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  idempotency_key uuid,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT credit_activity_balance_math_chk
    CHECK (balance_after = balance_before + delta)
);

CREATE INDEX IF NOT EXISTS credit_activity_customer_created_idx
  ON public.credit_activity (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_activity_user_created_idx
  ON public.credit_activity (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_activity_activity_type_idx
  ON public.credit_activity (activity_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS credit_activity_customer_idempotency_uidx
  ON public.credit_activity (customer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.credit_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own credit activity"
  ON public.credit_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = credit_activity.customer_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view credit activity"
  ON public.credit_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "Admins can insert credit activity"
  ON public.credit_activity
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

COMMENT ON TABLE public.credit_activity IS
  'Append-only ledger for every customer credit delta (positive and negative).';

COMMENT ON COLUMN public.credit_activity.delta IS
  'Signed credit change amount. Positive adds credits, negative deducts credits.';

COMMENT ON COLUMN public.credit_activity.balance_before IS
  'Customer credit balance before applying delta.';

COMMENT ON COLUMN public.credit_activity.balance_after IS
  'Customer credit balance after applying delta.';

COMMENT ON COLUMN public.credit_activity.source_ref IS
  'External/internal reference (payment intent, job id, request id, etc.).';

COMMENT ON COLUMN public.credit_activity.metadata IS
  'Structured details for the activity (JSON payload).';

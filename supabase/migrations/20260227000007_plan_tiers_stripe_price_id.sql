-- =====================================================
-- PLAN TIERS: merge stripe_price_id_monthly and stripe_price_id_yearly into stripe_price_id
-- =====================================================

ALTER TABLE public.plan_tiers
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Backfill: use monthly first, then yearly (one price per row)
UPDATE public.plan_tiers
SET stripe_price_id = COALESCE(
  NULLIF(TRIM(COALESCE(stripe_price_id_monthly, '')), ''),
  NULLIF(TRIM(COALESCE(stripe_price_id_yearly, '')), '')
)
WHERE stripe_price_id_monthly IS NOT NULL OR stripe_price_id_yearly IS NOT NULL;

ALTER TABLE public.plan_tiers
  DROP COLUMN IF EXISTS stripe_price_id_monthly,
  DROP COLUMN IF EXISTS stripe_price_id_yearly;

COMMENT ON COLUMN public.plan_tiers.stripe_price_id IS 'Stripe Price ID for this plan (matches billing_cycle: month or year)';

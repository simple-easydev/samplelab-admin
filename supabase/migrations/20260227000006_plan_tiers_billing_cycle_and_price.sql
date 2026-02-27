-- =====================================================
-- PLAN TIERS: billing_cycle, price, original_price
-- Remove price_monthly, price_yearly.
-- =====================================================

-- Add new columns
ALTER TABLE public.plan_tiers
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) NULL;

-- Backfill from existing columns (if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plan_tiers' AND column_name = 'price_monthly'
  ) THEN
    UPDATE public.plan_tiers
    SET
      price = COALESCE(price_monthly, 0),
      billing_cycle = 'month',
      original_price = NULL;
  END IF;
END $$;

-- Enforce not null and constraint
ALTER TABLE public.plan_tiers
  ALTER COLUMN billing_cycle SET NOT NULL,
  ALTER COLUMN billing_cycle SET DEFAULT 'month',
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE public.plan_tiers
  DROP CONSTRAINT IF EXISTS plan_tiers_billing_cycle_check;
ALTER TABLE public.plan_tiers
  ADD CONSTRAINT plan_tiers_billing_cycle_check CHECK (billing_cycle IN ('month', 'year'));

-- Drop old columns
ALTER TABLE public.plan_tiers
  DROP COLUMN IF EXISTS price_monthly,
  DROP COLUMN IF EXISTS price_yearly;

COMMENT ON COLUMN public.plan_tiers.billing_cycle IS 'Billing interval: month or year';
COMMENT ON COLUMN public.plan_tiers.price IS 'Current price (displayed as main price)';
COMMENT ON COLUMN public.plan_tiers.original_price IS 'Original price for display with strikethrough (optional)';

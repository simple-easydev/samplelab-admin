-- =====================================================
-- PLAN TIERS TABLE
-- =====================================================
-- Stores subscription plan tiers (Free, Starter, Pro, Elite, etc.)
-- used by PlanTiers admin page and can link to Stripe prices.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plan_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  credits_monthly INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_plan_tiers_updated_at ON public.plan_tiers;
CREATE TRIGGER update_plan_tiers_updated_at
  BEFORE UPDATE ON public.plan_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_tiers_name ON public.plan_tiers(name);
CREATE INDEX IF NOT EXISTS idx_plan_tiers_sort_order ON public.plan_tiers(sort_order);
CREATE INDEX IF NOT EXISTS idx_plan_tiers_is_active ON public.plan_tiers(is_active);

-- RLS
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;

-- Admins can view all plan tiers
CREATE POLICY "Admins can view plan_tiers"
  ON public.plan_tiers
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can insert/update/delete plan tiers
CREATE POLICY "Admins can manage plan_tiers"
  ON public.plan_tiers
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Optional: allow public read for active plans (e.g. customer app pricing page)
-- Uncomment if you need unauthenticated or customer read access:
-- CREATE POLICY "Anyone can view active plan_tiers"
--   ON public.plan_tiers
--   FOR SELECT
--   USING (is_active = true);

COMMENT ON TABLE public.plan_tiers IS 'Subscription plan tiers (Free, Pro, etc.) with pricing and Stripe price IDs';
COMMENT ON COLUMN public.plan_tiers.name IS 'Slug/key (e.g. free, pro) – must match subscription_tier values';
COMMENT ON COLUMN public.plan_tiers.stripe_price_id_monthly IS 'Stripe Price ID for monthly billing';
COMMENT ON COLUMN public.plan_tiers.stripe_price_id_yearly IS 'Stripe Price ID for yearly billing';

-- Seed free tier (others can be added via admin UI)
INSERT INTO public.plan_tiers (name, display_name, description, price_monthly, price_yearly, credits_monthly, is_popular, is_active, features, sort_order)
VALUES (
  'free',
  'Free',
  'Perfect for trying out the platform',
  0,
  0,
  25,
  false,
  true,
  ARRAY['25 credits/month', 'Basic sample library', 'Standard quality', 'Community support'],
  1
)
ON CONFLICT (name) DO NOTHING;

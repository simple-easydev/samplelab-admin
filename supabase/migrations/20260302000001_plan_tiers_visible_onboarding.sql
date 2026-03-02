-- Add visible_onboarding to plan_tiers (controls whether plan is shown in onboarding / get-stripe-products?visible_onboarding=true)
ALTER TABLE public.plan_tiers
  ADD COLUMN IF NOT EXISTS visible_onboarding BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.plan_tiers.visible_onboarding IS 'When true, plan is returned by get-stripe-products when called with ?visible_onboarding=true (e.g. for onboarding flow)';

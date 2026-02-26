-- Add onboarding_completed column to customers table
-- This tracks whether a customer has completed the onboarding process (e.g., subscribed to a plan)

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_onboarding_completed ON customers(onboarding_completed);

-- Add comment for documentation
COMMENT ON COLUMN customers.onboarding_completed IS 'Whether customer has completed onboarding (subscribed to a plan)';

-- Remove onboarding_completed column from customers table
-- This field is now tracked in user metadata instead

-- Drop the index first
DROP INDEX IF EXISTS idx_customers_onboarding_completed;

-- Drop the column
ALTER TABLE customers
DROP COLUMN IF EXISTS onboarding_completed;

-- =====================================================
-- SampleLab Admin Panel - Database Setup
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Authentication & Admin Management)
-- =====================================================
-- This table stores admin users and system access
-- Linked to Supabase Auth (auth.users)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert/update/delete users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. CUSTOMERS TABLE (Business Customers/Clients)
-- =====================================================
-- This table stores customer data for your business
-- Can optionally link to a user account (user_id)

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credit_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage customers" ON customers;

-- Customers can view their own data (if linked to a user)
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can manage customers
CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create updated_at trigger for customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. SAMPLES TABLE (Audio Samples Library)
-- =====================================================

CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view samples" ON samples;
DROP POLICY IF EXISTS "Admins can manage samples" ON samples;

-- Anyone can view samples
CREATE POLICY "Anyone can view samples" ON samples
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage samples" ON samples
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create updated_at trigger for samples
DROP TRIGGER IF EXISTS update_samples_updated_at ON samples;
CREATE TRIGGER update_samples_updated_at
    BEFORE UPDATE ON samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. SUBSCRIPTIONS TABLE (Customer Subscriptions)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;

-- Customers can view their own subscriptions
CREATE POLICY "Customers can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()
    )
  );

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can manage subscriptions
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create updated_at trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE FIRST ADMIN USER
-- =====================================================
-- IMPORTANT: After running this script, you need to:
-- 1. Create a user in Supabase Auth UI (Authentication > Users)
-- 2. Copy the user's UUID
-- 3. Run this SQL (replace with your user's UUID):

-- INSERT INTO users (id, email, name, is_admin)
-- VALUES (
--   'YOUR_USER_UUID_HERE',
--   'admin@samplelab.com',
--   'Admin User',
--   true
-- );

-- Or if the user already exists in the users table:
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';

-- =====================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample customers for testing:
-- INSERT INTO customers (email, name, company_name, phone, subscription_tier, credit_balance, status)
-- VALUES
--   ('customer1@example.com', 'John Doe', 'Acme Corp', '+1234567890', 'premium', 100, 'active'),
--   ('customer2@example.com', 'Jane Smith', 'Tech Solutions', '+0987654321', 'pro', 50, 'active'),
--   ('customer3@example.com', 'Bob Johnson', 'Startup Inc', NULL, 'free', 10, 'active');

-- Uncomment to insert sample samples for testing:
-- INSERT INTO samples (title, description, file_url, file_size, download_count)
-- VALUES
--   ('Kick Drum 808', 'Classic 808 kick drum sample', 'https://example.com/kick.wav', 524288, 150),
--   ('Snare Tight', 'Tight snare drum hit', 'https://example.com/snare.wav', 262144, 89),
--   ('Hi-Hat Closed', 'Closed hi-hat sample', 'https://example.com/hihat.wav', 131072, 234);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create your first admin user in Supabase Auth
-- 2. Link the auth user to the users table with is_admin = true
-- 3. Run npm run dev
-- 4. Login and access /admin
-- =====================================================

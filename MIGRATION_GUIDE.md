# Database Migration Guide - Using Supabase CLI

## Overview

This guide will help you migrate your existing database to the new Users + Customers architecture using Supabase CLI migrations.

---

## Prerequisites

✅ Supabase CLI installed  
✅ Existing Supabase project with database  
✅ Local project linked to Supabase  

---

## Step 1: Link Your Project (if not already linked)

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Get your project ref from: https://app.supabase.com/project/_/settings/general
```

---

## Step 2: Check Current Database State

```bash
# Pull current schema from remote
npx supabase db pull

# This creates a file showing your current database state
```

---

## Step 3: Create Migration Files

I'll create migration files for you. Choose the appropriate scenario:

### Scenario A: Fresh Database (No Existing Tables)
If you have an empty database, you can create all tables fresh.

### Scenario B: Existing Users Table
If you already have a `users` table with customers mixed in, we need to:
1. Create the new `customers` table
2. Migrate existing customer data
3. Update the `users` table structure

### Scenario C: Update Existing Tables
If you have tables but need to add/modify columns.

---

## Step 4: Create Migrations

### For Fresh Database:

```bash
# Create a new migration
npx supabase migration new initial_setup

# This creates: supabase/migrations/TIMESTAMP_initial_setup.sql
```

Then copy the contents of `DATABASE_SETUP.sql` into that migration file.

### For Existing Database with Data:

```bash
# Create migration for new structure
npx supabase migration new add_customers_table

# Create migration for data migration
npx supabase migration new migrate_user_data_to_customers
```

---

## Step 5: Apply Migrations

### Test Locally First (Recommended):

```bash
# Start local Supabase
npx supabase start

# Apply migrations locally
npx supabase db reset

# Test your app locally
npm run dev
```

### Apply to Remote Database:

```bash
# Push migrations to your remote database
npx supabase db push

# This will apply all pending migrations
```

---

## Step 6: Verify Changes

```bash
# Check migration status
npx supabase migration list

# Pull schema to verify
npx supabase db pull
```

---

## Migration Scenarios

### Scenario A: Fresh Database

**Migration File**: `supabase/migrations/TIMESTAMP_initial_setup.sql`

```sql
-- Copy entire contents of DATABASE_SETUP.sql here
```

**Command**:
```bash
npx supabase migration new initial_setup
# Paste DATABASE_SETUP.sql content
npx supabase db push
```

---

### Scenario B: Migrate Existing Users to Customers

**Step 1**: Create customers table

**Migration File**: `supabase/migrations/TIMESTAMP_add_customers_table.sql`

```sql
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credit_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Step 2**: Migrate non-admin users to customers

**Migration File**: `supabase/migrations/TIMESTAMP_migrate_users_to_customers.sql`

```sql
-- Migrate non-admin users to customers table
INSERT INTO customers (user_id, email, name, subscription_tier, credit_balance, status, created_at, updated_at)
SELECT 
  id,
  email,
  name,
  subscription_tier,
  credit_balance,
  'active' as status,
  created_at,
  updated_at
FROM users
WHERE is_admin = false OR is_admin IS NULL;

-- Optional: Remove subscription fields from users table
-- (Only do this after verifying the migration worked)
-- ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
-- ALTER TABLE users DROP COLUMN IF EXISTS credit_balance;
```

**Commands**:
```bash
npx supabase migration new add_customers_table
# Add Step 1 SQL

npx supabase migration new migrate_users_to_customers
# Add Step 2 SQL

npx supabase db push
```

---

### Scenario C: Update Existing Tables

**Migration File**: `supabase/migrations/TIMESTAMP_update_users_table.sql`

```sql
-- Remove fields that moved to customers
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS credit_balance;

-- Ensure is_admin column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
```

---

## Safe Migration Workflow

### 1. Backup First! 🚨

```bash
# Create a backup before any changes
# In Supabase Dashboard: Database > Backups > Create Backup
```

### 2. Test Locally

```bash
# Start local Supabase
npx supabase start

# Reset local database with migrations
npx supabase db reset

# Test your application
npm run dev
```

### 3. Review Changes

```bash
# Check what will change
npx supabase db diff

# Review migration files
```

### 4. Apply to Production

```bash
# Push to remote
npx supabase db push

# Verify in dashboard
```

---

## Rollback Strategy

### If Something Goes Wrong:

```bash
# Restore from backup in Supabase Dashboard
# Database > Backups > Restore

# Or rollback specific migration:
# 1. Create a new migration that reverses changes
npx supabase migration new rollback_customers
```

---

## Common Issues & Solutions

### Issue: "relation already exists"
**Solution**: Migration trying to create existing table. Add `IF NOT EXISTS`:
```sql
CREATE TABLE IF NOT EXISTS customers (...);
```

### Issue: "column does not exist"
**Solution**: Check column names match your current schema:
```sql
-- Check current columns
\d users
```

### Issue: Data loss during migration
**Solution**: Always backup first! Use `INSERT ... SELECT` to copy data.

---

## Verification Checklist

After migration, verify:

- [ ] All tables exist (users, customers, samples, subscriptions)
- [ ] RLS policies are active
- [ ] Triggers are working (updated_at)
- [ ] Data migrated correctly
- [ ] Admin users still have access
- [ ] Application connects successfully
- [ ] No errors in Supabase logs

---

## Quick Reference Commands

```bash
# Link project
npx supabase link --project-ref YOUR_REF

# Create migration
npx supabase migration new MIGRATION_NAME

# Apply locally
npx supabase db reset

# Apply to remote
npx supabase db push

# Check status
npx supabase migration list

# Pull current schema
npx supabase db pull

# View differences
npx supabase db diff
```

---

## Next Steps

1. Choose your scenario (A, B, or C)
2. Create migration files
3. Test locally first
4. Backup your database
5. Apply to production
6. Verify everything works

---

**Need Help?** 
- Check migration files in `supabase/migrations/`
- Review Supabase CLI docs: https://supabase.com/docs/guides/cli
- Test locally before pushing to production!

# 🚀 START HERE - Database Migration with Supabase CLI

## Your Situation
✅ Supabase CLI installed  
✅ Existing database in Supabase  
❓ Need to add Users + Customers tables  

---

## Quick 5-Step Guide

### Step 1: Link Your Project (2 minutes)

```bash
# Navigate to your project
cd d:\work\SampleLab\admin

# Login to Supabase
npx supabase login

# Link to your remote project
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref:**
1. Go to: https://app.supabase.com
2. Select your project
3. Go to: Settings > General
4. Copy the "Reference ID"

---

### Step 2: Check What You Have (1 minute)

```bash
# Pull your current database schema
npx supabase db pull
```

This creates: `supabase/migrations/TIMESTAMP_remote_schema.sql`

Open it and see what tables you currently have.

---

### Step 3: Backup Your Database! (1 minute) 🚨

**IMPORTANT**: Always backup before making changes!

1. Go to Supabase Dashboard
2. Navigate to: **Database > Backups**
3. Click **"Create Backup"**
4. Wait for backup to complete

---

### Step 4: Apply New Schema (1 minute)

```bash
# Push the migration I created for you
npx supabase db push
```

This will apply the migration file:
- `supabase/migrations/20260204000001_initial_setup.sql`

It creates:
- ✅ `users` table (admin users)
- ✅ `customers` table (business customers)
- ✅ `samples` table (audio library)
- ✅ `subscriptions` table (customer subscriptions)
- ✅ All RLS policies
- ✅ Triggers for `updated_at`

---

### Step 5: Create Your Admin User (2 minutes)

#### 5a. Create Auth User

1. Go to Supabase Dashboard
2. Navigate to: **Authentication > Users**
3. Click **"Add user"**
4. Enter:
   - Email: `admin@samplelab.com` (or your email)
   - Password: Your secure password
5. Click **"Create user"**
6. **Copy the UUID** from the users list

#### 5b. Link to Users Table

1. Go to: **SQL Editor**
2. Run this SQL (replace `YOUR_UUID`):

```sql
INSERT INTO users (id, email, name, is_admin)
VALUES (
  'YOUR_UUID_HERE',  -- Paste the UUID you copied
  'admin@samplelab.com',
  'Admin User',
  true  -- This makes you an admin!
);
```

---

## ✅ Done! Now Test It

### Start Your App

```bash
npm run dev
```

### Visit Admin Panel

Open: http://localhost:3000/admin

You should see:
- 📊 Dashboard with stats
- 👥 Customers page
- 🔐 Users page (you should see yourself!)
- 🎵 Samples page
- 📈 Analytics page

---

## 🎯 What If...

### What if I already have a `users` table?

The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't overwrite.

**But if your existing table has different columns:**
1. See: `MIGRATION_GUIDE.md` > Scenario B
2. You'll need a custom migration to migrate data

### What if I get errors?

**Error: "relation already exists"**
- Your table exists but migration is trying to create it
- Solution: Modify migration to use `ALTER TABLE` instead

**Error: "permission denied"**
- Not linked to correct project
- Solution: Run `npx supabase link --project-ref YOUR_REF` again

**Error: "column does not exist"**
- Table exists with different structure
- Solution: Check `MIGRATION_GUIDE.md` for migration scenarios

### What if I want to test first?

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Apply migrations locally
npx supabase db reset

# Test your app against local database
npm run dev

# When satisfied, push to remote
npx supabase db push
```

---

## 📋 Verification Checklist

After completing all steps:

- [ ] Can login to http://localhost:3000/admin
- [ ] See your admin user in Users page
- [ ] Dashboard shows stats (all zeros is fine)
- [ ] Can navigate to all pages
- [ ] No errors in browser console
- [ ] No errors in terminal

---

## 📚 Next Steps

1. **Add test data**: Add some customers for testing
2. **Implement auth**: Complete the login page functionality
3. **Upload samples**: Build sample upload feature (Milestone 2)

---

## 🆘 Need Help?

### Reference Documents:
- `SUPABASE_CLI_COMMANDS.md` - All CLI commands
- `MIGRATION_GUIDE.md` - Detailed migration scenarios
- `USERS_VS_CUSTOMERS.md` - Architecture explanation
- `DATABASE_SETUP.sql` - Complete SQL if you want to run manually

### Check Your Setup:

```bash
# Check CLI version
npx supabase --version

# Check project status
npx supabase status

# Check migration status
npx supabase migration list
```

---

## 🎉 You're Almost There!

Just follow these 5 steps:

1. ✅ Link project → `npx supabase link`
2. ✅ Check current schema → `npx supabase db pull`
3. ✅ Backup database → Supabase Dashboard
4. ✅ Apply migration → `npx supabase db push`
5. ✅ Create admin user → SQL Editor

Then visit: http://localhost:3000/admin

---

**Ready? Let's do this! 🚀**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

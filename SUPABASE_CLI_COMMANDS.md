# Supabase CLI - Quick Command Reference

## 🚀 Quick Start (For Your Situation)

Since you already have Supabase CLI and an existing database, here's what to do:

### Step 1: Link Your Project

```bash
# Login to Supabase
npx supabase login

# Link to your existing project
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Get your project ref**: https://app.supabase.com/project/_/settings/general

### Step 2: Check Current Database

```bash
# Pull current schema to see what you have
npx supabase db pull

# This creates: supabase/migrations/TIMESTAMP_remote_schema.sql
```

### Step 3: Apply New Schema

```bash
# Push the migration I created for you
npx supabase db push

# This will apply: supabase/migrations/20260204000001_initial_setup.sql
```

### Step 4: Create Your Admin User

After migration completes:

```bash
# Get your auth user UUID from Supabase Dashboard
# Then run in Supabase SQL Editor:
```

```sql
INSERT INTO users (id, email, name, is_admin)
VALUES ('YOUR_AUTH_UUID', 'admin@samplelab.com', 'Admin', true);
```

---

## 📋 Complete Command Reference

### Project Management

```bash
# Login
npx supabase login

# Initialize new project (you don't need this - already done)
npx supabase init

# Link to remote project
npx supabase link --project-ref YOUR_PROJECT_REF

# Check project status
npx supabase status
```

### Database Commands

```bash
# Pull schema from remote
npx supabase db pull

# Push migrations to remote
npx supabase db push

# Reset local database (careful!)
npx supabase db reset

# Show differences between local and remote
npx supabase db diff

# Execute SQL directly
npx supabase db execute --file your-file.sql
```

### Migration Commands

```bash
# Create new migration
npx supabase migration new MIGRATION_NAME

# List all migrations
npx supabase migration list

# Repair migration history (if something went wrong)
npx supabase migration repair
```

### Local Development

```bash
# Start local Supabase (Docker required)
npx supabase start

# Stop local Supabase
npx supabase stop

# View logs
npx supabase logs
```

### Type Generation

```bash
# Generate TypeScript types from database
npx supabase gen types typescript --local > types/supabase.ts
npx supabase gen types typescript --linked > types/supabase.ts
```

---

## 🎯 Common Workflows

### Workflow 1: Apply Changes to Existing Database

```bash
# 1. Link project
npx supabase link --project-ref YOUR_REF

# 2. Backup first! (In Supabase Dashboard)
# Database > Backups > Create Backup

# 3. Push migrations
npx supabase db push

# 4. Verify
npx supabase db pull
```

### Workflow 2: Create New Migration

```bash
# 1. Create migration file
npx supabase migration new add_new_feature

# 2. Edit the file: supabase/migrations/TIMESTAMP_add_new_feature.sql

# 3. Test locally (optional)
npx supabase start
npx supabase db reset

# 4. Apply to remote
npx supabase db push
```

### Workflow 3: Sync Local with Remote

```bash
# Pull latest schema
npx supabase db pull

# This will show you what's in your remote database
```

---

## ⚠️ Important Notes

### Before Running db push:

1. **Backup your database!**
   - Supabase Dashboard > Database > Backups > Create Backup

2. **Check what will change:**
   ```bash
   npx supabase db diff
   ```

3. **Test locally first (if possible):**
   ```bash
   npx supabase start
   npx supabase db reset
   ```

### Migration Files

- Location: `supabase/migrations/`
- Format: `TIMESTAMP_description.sql`
- Applied in order by timestamp
- Never delete or modify applied migrations!

### If Something Goes Wrong:

```bash
# 1. Restore backup in Supabase Dashboard

# 2. Or create rollback migration:
npx supabase migration new rollback_changes

# 3. Write SQL to undo changes
# 4. Push rollback:
npx supabase db push
```

---

## 🔍 Checking Your Current Database

### Option 1: Using Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: Database > Tables
4. Check what tables exist

### Option 2: Using CLI

```bash
# Pull current schema
npx supabase db pull

# Open: supabase/migrations/TIMESTAMP_remote_schema.sql
# This shows your current database structure
```

### Option 3: Using SQL Editor

Go to SQL Editor and run:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check users table structure
\d users

-- Check if users table has old fields
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

---

## 💡 Recommended Steps for You

Based on your situation (existing database), here's what I recommend:

### Step 1: Check What You Have

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db pull
```

Look at the generated file to see your current schema.

### Step 2: Choose Migration Strategy

**If you have NO data yet:**
```bash
# Just push the new schema
npx supabase db push
```

**If you have existing data:**
1. Create backup first!
2. Create custom migration to preserve data
3. See `MIGRATION_GUIDE.md` for scenarios

### Step 3: Apply Changes

```bash
# Backup first in Dashboard!
npx supabase db push
```

### Step 4: Create Admin User

```sql
-- In Supabase SQL Editor
INSERT INTO users (id, email, name, is_admin)
VALUES ('YOUR_AUTH_UUID', 'admin@samplelab.com', 'Admin', true);
```

### Step 5: Test

```bash
npm run dev
# Visit: http://localhost:3000/admin
```

---

## 🆘 Troubleshooting

### Error: "relation already exists"

Your database already has some tables.

**Solution**:
```sql
-- The migration uses IF NOT EXISTS, so it should be fine
-- But if you get errors, check existing tables first
```

### Error: "permission denied"

**Solution**:
```bash
# Make sure you're linked to the correct project
npx supabase link --project-ref YOUR_REF
```

### Error: "migration already applied"

**Solution**:
```bash
# Check migration status
npx supabase migration list

# If needed, repair
npx supabase migration repair
```

---

## 📚 Resources

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Migration Guide: `MIGRATION_GUIDE.md` (in this project)
- Database Setup: `DATABASE_SETUP.sql` (in this project)

---

## ✅ Quick Checklist

- [ ] Supabase CLI installed (`npx supabase --version`)
- [ ] Logged in (`npx supabase login`)
- [ ] Project linked (`npx supabase link`)
- [ ] Database backed up (Supabase Dashboard)
- [ ] Current schema pulled (`npx supabase db pull`)
- [ ] Reviewed what exists
- [ ] Ready to push migration (`npx supabase db push`)

---

**Next Step**: Link your project and check current schema!

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db pull
```

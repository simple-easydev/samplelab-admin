# Add User Status and Tracking Fields - Migration Guide

## Summary
This migration adds status tracking, last login timestamps, and invited_by references to the users table to support the Admin & Roles page requirements.

## New Database Fields

### Users Table Updates
- **status**: Enum type (`active`, `pending`, `disabled`) - Tracks admin access status
- **last_login**: Timestamp - Records when admin last logged in
- **invited_by**: UUID - References the admin who invited this user

## Migration Files Created

1. **20260209000001_add_user_status_and_tracking.sql**
   - Adds status, last_login, and invited_by columns
   - Creates enum types for status and role
   - Adds indexes for performance
   - Backfills existing admin users with 'active' status

2. **20260209000002_update_admin_user_function.sql**
   - Updates `create_admin_user_record()` function to accept invited_by parameter
   - Creates `update_user_last_login()` function for tracking logins
   - Sets new users to 'active' status by default

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# If you have Supabase CLI installed and linked
npx supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - First: `20260209000001_add_user_status_and_tracking.sql`
   - Second: `20260209000002_update_admin_user_function.sql`

## TypeScript Types Updated

The `User` interface in `src/types/index.ts` has been updated to include:
```typescript
status: "active" | "pending" | "disabled";
last_login: string | null;
invited_by: string | null;
```

## Component Updates

### AdminsTable Component
- Now properly updates status when enabling/disabling admins
- Displays real status from database instead of hardcoded values

### Roles Page
- Removed placeholder TODO comments
- Uses actual database fields for status, last_login, and invited_by

## Future Enhancements

### Track Last Login
To track when admins log in, call the `update_user_last_login()` function after successful login:

```typescript
// In Login.tsx after successful authentication
await supabase.rpc('update_user_last_login', { p_user_id: data.user.id });
```

### Set Pending Status for Invites
When creating invites, you can optionally create a placeholder user with pending status, or handle this in your Edge Function.

## Testing

After applying migrations:

1. **Check existing admins**: All existing admin users should have `status = 'active'`
2. **Test new invites**: New admins should be created with `status = 'active'` and proper `invited_by` reference
3. **Test status changes**: Try disabling/enabling admins through the UI
4. **Verify role changes**: Ensure role updates work as expected

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove new columns
ALTER TABLE users 
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS last_login,
  DROP COLUMN IF EXISTS invited_by;

-- Drop enum types
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_role;

-- Revert function to original
-- (Re-run the original from 20260205000002_create_admin_user_function.sql)
```

## Next Steps

1. Apply the migrations to your Supabase database
2. Test the Admin & Roles page functionality
3. Optionally implement last_login tracking in your login flow
4. Consider adding email notifications for status changes

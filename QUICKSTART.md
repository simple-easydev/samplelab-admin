# Quick Start Guide

Get your SampleLab Admin Panel up and running in 5 minutes!

## Prerequisites Check

- [x] Node.js 18+ installed
- [x] Supabase account created
- [x] Project dependencies installed (`npm install` ✅ already done)

## Step-by-Step Setup

### Step 1: Database Setup (5 minutes)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open the file `DATABASE_SETUP.sql` in this project
4. Copy the **entire file** and paste into SQL Editor
5. Click **"Run"** to create all tables:
   - Users table (admin users)
   - Customers table (business customers)
   - Samples table
   - Subscriptions table

### Step 2: Create Admin User (2 minutes)

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **"Add user"** and create your admin account
3. Copy the user's UUID from the Users list
4. Run this in SQL Editor (replace with your UUID and email):

```sql
INSERT INTO users (id, email, name, is_admin)
VALUES (
  'YOUR_USER_UUID_HERE',
  'admin@samplelab.com',
  'Admin User',
  true
);
```

### Step 3: Start Development Server (1 minute)

```bash
cd admin
npm run dev
```

### Step 4: Access Admin Panel (1 minute)

1. Open browser: http://localhost:3000
2. Navigate to: http://localhost:3000/admin

🎉 You're done! Your admin panel is running.

## Quick Test

Test each page:
- ✅ Admin Dashboard: http://localhost:3000/admin
- ✅ Customers: http://localhost:3000/admin/customers
- ✅ Users (Admin): http://localhost:3000/admin/users
- ✅ Samples: http://localhost:3000/admin/samples
- ✅ Analytics: http://localhost:3000/admin/analytics

## Troubleshooting

**Problem**: "Unauthorized" when accessing /admin
- **Solution**: Make sure you set `is_admin = true` for your user in the database

**Problem**: "Cannot GET /api/admin/stats"
- **Solution**: Make sure dev server is running and tables are created

**Problem**: No users showing in /admin/users
- **Solution**: Create a user in Supabase Auth and link to users table with INSERT statement

**Problem**: What's the difference between Users and Customers?
- **Solution**: See `USERS_VS_CUSTOMERS.md` for complete explanation

## What's Next?

1. **Implement Authentication**: Add login/signup pages
2. **Upload Samples**: Build the bulk upload feature (Milestone 2)
3. **User Management**: Add user detail pages and actions
4. **Analytics**: Build the analytics dashboard

## Project Files Overview

| File | Purpose |
|------|---------|
| `.env.local` | Your Supabase credentials (already configured) |
| `app/admin/` | All admin pages |
| `lib/supabase.ts` | Database client configuration |
| `lib/auth.ts` | Authentication helpers |
| `components/AdminSidebar.tsx` | Navigation sidebar |
| `types/` | TypeScript type definitions |

## Need Help?

- See `README.md` for detailed documentation
- See `SETUP_COMPLETE.md` for feature overview
- Check Supabase docs: https://supabase.com/docs

---

Happy coding! 🚀

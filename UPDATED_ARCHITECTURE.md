# ✅ Updated Architecture - Users vs Customers

## What Changed?

The database has been restructured to **separate Users from Customers**. This is a better architecture for your admin panel.

---

## 🔑 Key Differences

### Before (Original):
```
users table:
- Admin users + Customers mixed together
- subscription_tier field
- credit_balance field
```

### After (Updated): ✅
```
users table:
- ONLY admin users
- System access control
- is_admin flag

customers table:
- ONLY business customers
- subscription_tier field
- credit_balance field
- company_name, phone fields
- status field
```

---

## 📊 New Admin Panel Structure

### Updated Navigation
```
📊 Dashboard
🎵 Samples
👥 Customers    ← NEW (business customers)
🔐 Users        ← UPDATED (admin users only)
📈 Analytics
```

### Dashboard Stats (5 cards now)
1. **Admin Users** (🔐) - System access users
2. **Customers** (👥) - Business customers
3. **Subscriptions** (⭐) - Active paid subscriptions
4. **Samples** (🎵) - Audio samples in library
5. **Downloads** (📥) - Total downloads

---

## 🗂️ Database Tables

### 1. Users Table (Admin Access)
```sql
CREATE TABLE users (
  id UUID,
  email TEXT,
  name TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Authentication & admin panel access  
**Typical Users**: 5-20 admin users  
**Page**: `/admin/users`

### 2. Customers Table (Business)
```sql
CREATE TABLE customers (
  id UUID,
  user_id UUID,           -- Optional link to users
  email TEXT,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT,
  credit_balance INTEGER,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Customer management & subscriptions  
**Typical Users**: 100-10,000+ customers  
**Page**: `/admin/customers`

---

## 📁 New Files Created

1. **DATABASE_SETUP.sql**
   - Complete database setup script
   - Run this in Supabase SQL Editor
   - Creates all tables with RLS policies

2. **USERS_VS_CUSTOMERS.md**
   - Detailed explanation of architecture
   - Use cases and examples
   - Best practices

3. **UPDATED_ARCHITECTURE.md** (this file)
   - Quick summary of changes
   - Migration guide

4. **Updated Admin Pages**
   - `/app/admin/customers/page.tsx` - New customers page
   - `/app/admin/users/page.tsx` - Updated for admin users only
   - `/app/api/admin/customers/route.ts` - New API endpoint

---

## 🚀 How to Set Up

### Step 1: Run Database Setup
```sql
-- Go to Supabase SQL Editor
-- Copy and paste DATABASE_SETUP.sql
-- Click "Run"
```

### Step 2: Create Your Admin User
```sql
-- 1. Create user in Supabase Auth UI
-- 2. Copy the user UUID
-- 3. Run this SQL:

INSERT INTO users (id, email, name, is_admin)
VALUES (
  'YOUR_AUTH_UUID',
  'admin@samplelab.com',
  'Admin User',
  true
);
```

### Step 3: (Optional) Add Test Customers
```sql
INSERT INTO customers (email, name, company_name, subscription_tier, credit_balance, status)
VALUES
  ('customer1@example.com', 'John Doe', 'Acme Corp', 'premium', 100, 'active'),
  ('customer2@example.com', 'Jane Smith', 'Tech Solutions', 'pro', 50, 'active');
```

### Step 4: Run the App
```bash
npm run dev
```

---

## 🎯 Use Cases

### When to Create a User (Admin)
✅ Internal team member needs admin panel access  
✅ Someone who will manage the platform  
✅ System administrator  

**Action**: Create in Supabase Auth, then add to `users` table with `is_admin = true`

### When to Create a Customer
✅ Someone purchases a subscription  
✅ New business client signs up  
✅ Free trial signup  

**Action**: Add to `customers` table (no authentication needed)

### When to Link Customer to User
✅ Customer needs to login and view their data  
✅ Customer portal access  
✅ Self-service subscription management  

**Action**: Create user in Auth, add to both `users` (is_admin=false) and `customers` (user_id=linked)

---

## 📄 Pages Overview

### `/admin` - Dashboard
- Shows stats for both users and customers
- 5 stat cards (users, customers, subscriptions, samples, downloads)
- Quick actions for customers and users

### `/admin/customers` - Customer Management
- Table with all business customers
- Columns: Name, Company, Email, Phone, Subscription, Credits, Status
- Search by email/name/company
- Stats: Total, Active, Premium, Total Credits

### `/admin/users` - User Management
- Table with admin users
- Columns: Name, Email, Role (Admin/User), Created Date
- Add new admin users
- Stats: Total Users, Admin Users

### `/admin/samples` - Sample Library
- Placeholder for Milestone 2
- Bulk upload coming soon

---

## 🔒 Security (Row Level Security)

### Users Table RLS
- Users can view their own record
- Admins can view/manage all users

### Customers Table RLS
- Customers can view their own record (if linked via user_id)
- Admins can view/manage all customers

### Samples Table RLS
- Anyone can view samples
- Only admins can manage samples

---

## ✅ Type Safety

All TypeScript types have been updated:

```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  company_name: string | null;
  phone: string | null;
  subscription_tier: string;
  credit_balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}
```

---

## 📊 API Endpoints

### Existing (Updated)
- `GET /api/admin/stats` - Now includes `total_customers`
- `GET /api/admin/users` - Returns admin users only

### New
- `GET /api/admin/customers` - Returns all customers

---

## ✨ Benefits of This Architecture

1. **Clear Separation**: Admin users vs business customers
2. **Scalability**: Can have thousands of customers without affecting admin user table
3. **Flexibility**: Customers can exist without user accounts
4. **Security**: Better RLS policies for each entity
5. **Clarity**: Easier to understand and maintain
6. **Optional Linking**: Customers can be linked to user accounts when needed

---

## 📚 Documentation

- **DATABASE_SETUP.sql** - Complete SQL setup
- **USERS_VS_CUSTOMERS.md** - Detailed architecture guide
- **README.md** - Updated with new structure
- **QUICKSTART.md** - Updated setup steps

---

## 🎉 Summary

You now have a **professional, scalable architecture** that separates:

- **Admin Users** (internal team, system access)
- **Customers** (business clients, subscriptions)

This is the standard approach used by SaaS platforms and provides better organization, security, and scalability.

---

**Next Step**: Run `DATABASE_SETUP.sql` in Supabase and create your first admin user!

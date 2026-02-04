# Users vs Customers - Database Architecture

## Overview

The SampleLab Admin Panel uses **two separate tables** for managing different types of accounts:

1. **Users Table** - Authentication & System Access
2. **Customers Table** - Business Customers/Clients

## 📋 Users Table

### Purpose
Manages **admin users** and **system access** for the admin panel.

### Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Fields
- `id` - Links to Supabase Auth (auth.users)
- `email` - User's email address
- `name` - User's full name
- `is_admin` - Admin flag (true = can access admin panel)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Use Cases
- Admin panel authentication
- System access control
- User role management
- Admin-only features

### Admin Panel Pages
- `/admin/users` - Manage admin users

---

## 👥 Customers Table

### Purpose
Manages **business customers** who use your platform/service.

### Schema
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- Optional link
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credit_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Fields
- `id` - Unique customer ID
- `user_id` - Optional link to users table (if customer has login)
- `email` - Customer's email
- `name` - Customer's full name
- `company_name` - Customer's company
- `phone` - Contact phone number
- `subscription_tier` - Subscription level (free, pro, premium)
- `credit_balance` - Available credits
- `status` - Account status (active, inactive, suspended)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Use Cases
- Customer relationship management
- Subscription management
- Credit tracking
- Customer support
- Billing and invoicing

### Admin Panel Pages
- `/admin/customers` - Manage customers
- `/admin/dashboard` - View customer stats

---

## 🔗 Relationship

### Optional Link
Customers can **optionally** be linked to users via `user_id`:

```
customers.user_id → users.id
```

### Scenarios

#### 1. Customer WITHOUT User Account
```
customers: {
  id: "cust-123",
  user_id: null,  ← No login access
  email: "customer@example.com",
  name: "John Doe",
  subscription_tier: "premium"
}
```
**Use case**: Customer who purchases without needing login

#### 2. Customer WITH User Account
```
users: {
  id: "user-456",
  email: "customer@example.com",
  is_admin: false
}

customers: {
  id: "cust-123",
  user_id: "user-456",  ← Links to user
  email: "customer@example.com",
  subscription_tier: "premium"
}
```
**Use case**: Customer with login access to view their data

#### 3. Admin User (NO Customer Record)
```
users: {
  id: "user-789",
  email: "admin@samplelab.com",
  is_admin: true  ← Admin access
}

customers: (none)
```
**Use case**: Admin who manages the system but isn't a customer

---

## 📊 Key Differences

| Aspect | Users | Customers |
|--------|-------|-----------|
| **Purpose** | System access | Business clients |
| **Authentication** | Yes (Supabase Auth) | Optional |
| **Admin Panel Access** | If `is_admin = true` | No direct access |
| **Subscription** | No | Yes (tier field) |
| **Credits** | No | Yes (credit_balance) |
| **Company Info** | No | Yes (company_name, phone) |
| **Status Tracking** | No | Yes (active/inactive/suspended) |
| **Typical Count** | Low (5-20) | High (100-10,000+) |

---

## 🎯 When to Use Each

### Use **Users** Table When:
- Creating admin accounts
- Managing system access
- Setting up authentication
- Controlling who can access /admin

### Use **Customers** Table When:
- Adding new business customers
- Managing subscriptions
- Tracking credits/usage
- Customer relationship management
- Billing and invoicing

---

## 🔄 Common Workflows

### 1. Create Admin User
```sql
-- Step 1: Create auth user in Supabase Auth UI
-- Step 2: Link to users table
INSERT INTO users (id, email, name, is_admin)
VALUES ('auth-uuid', 'admin@company.com', 'Admin Name', true);
```

### 2. Create Customer (No Login)
```sql
INSERT INTO customers (email, name, company_name, subscription_tier)
VALUES ('customer@company.com', 'John Doe', 'Acme Corp', 'premium');
```

### 3. Create Customer (With Login)
```sql
-- Step 1: Create auth user
-- Step 2: Create user record
INSERT INTO users (id, email, name, is_admin)
VALUES ('auth-uuid', 'customer@company.com', 'John Doe', false);

-- Step 3: Create customer record
INSERT INTO customers (user_id, email, name, company_name, subscription_tier)
VALUES ('auth-uuid', 'customer@company.com', 'John Doe', 'Acme Corp', 'premium');
```

### 4. Convert Customer to Admin
```sql
-- If customer needs admin access:
UPDATE users SET is_admin = true WHERE id = 'user-uuid';
```

---

## 📈 Statistics in Admin Dashboard

The admin dashboard shows both:

```typescript
{
  total_users: 5,          // Admin users (from users table)
  total_customers: 1234,   // Business customers (from customers table)
  active_subscriptions: 456,
  total_samples: 5000,
  total_downloads: 150000
}
```

---

## 🔒 Security

### Row Level Security (RLS)

#### Users Table
- Users can view their own record
- Admins can view all users
- Admins can manage users

#### Customers Table
- Customers can view their own record (if linked via user_id)
- Admins can view all customers
- Admins can manage customers

---

## ✅ Best Practices

1. **Keep them separate**: Don't mix admin users with customers
2. **Use user_id link**: Only when customer needs login access
3. **Admin flag**: Only for trusted users who need admin panel access
4. **Customer status**: Track customer lifecycle (active/inactive/suspended)
5. **Regular cleanup**: Archive inactive customers periodically

---

## 🎓 Summary

- **Users** = Internal team, admin access
- **Customers** = External clients, your business customers
- **Optional link** = Customer can have user account if needed
- **Separate concerns** = Clear separation of authentication vs business logic

This architecture provides flexibility while maintaining clear boundaries between system users and business customers.

# SampleLab Admin Panel

A modern admin panel built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎵 Sample library management
- 👥 User management
- 📊 Analytics dashboard
- 🔐 Admin authentication with Row Level Security
- 🎨 Modern UI with Tailwind CSS
- 🚀 Built with Next.js App Router
- 📱 Fully responsive design

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase with @supabase/ssr
- **Linting**: ESLint
- **Formatting**: Prettier

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or higher
- npm or yarn
- A Supabase account and project

## Getting Started

### 1. Clone and Install

```bash
# Navigate to the project directory
cd admin

# Install dependencies
npm install
```

### 2. Environment Setup

The `.env.local` file has been created with your Supabase credentials. If you need to update them:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**Note**: Keep the `SUPABASE_SERVICE_ROLE_KEY` secret and never expose it in client-side code!

### 3. Database Setup

**IMPORTANT**: The project uses **two separate tables**:
- **Users Table**: For admin users and system access
- **Customers Table**: For business customers/clients

For complete database setup, run the SQL script in `DATABASE_SETUP.sql`:

```bash
# 1. Go to your Supabase SQL Editor
# 2. Copy and paste the entire DATABASE_SETUP.sql file
# 3. Click "Run"
```

Or see the complete SQL file: [DATABASE_SETUP.sql](./DATABASE_SETUP.sql)

For more information on the Users vs Customers architecture, see: [USERS_VS_CUSTOMERS.md](./USERS_VS_CUSTOMERS.md)

### 4. Create Your First Admin User

**Step 1**: Create a user in Supabase Auth
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" or "Invite user"
3. Enter email and password (e.g., `admin@samplelab.com`)

**Step 2**: Link to users table and set admin flag
```sql
-- Get the user ID from Authentication > Users, then run:
INSERT INTO users (id, email, name, is_admin)
VALUES (
  'YOUR_AUTH_USER_UUID',  -- Copy from Supabase Auth UI
  'admin@samplelab.com',
  'Admin User',
  true  -- This makes them an admin
);
```

**Alternative**: If user record already exists:
```sql
UPDATE users
SET is_admin = true
WHERE email = 'admin@samplelab.com';
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
admin/
├── app/                      # Next.js App Router
│   ├── admin/               # Admin panel routes
│   │   ├── layout.tsx       # Admin layout with sidebar
│   │   ├── page.tsx         # Admin dashboard
│   │   ├── samples/         # Sample management
│   │   ├── users/           # User management
│   │   └── analytics/       # Analytics (placeholder)
│   ├── api/                 # API routes
│   │   └── admin/           # Admin API endpoints
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # Reusable components
│   └── AdminSidebar.tsx     # Admin navigation sidebar
├── lib/                     # Utilities and configurations
│   ├── supabase.ts          # Supabase client setup
│   └── auth.ts              # Authentication helpers
├── types/                   # TypeScript type definitions
│   ├── database.ts          # Database types
│   └── index.ts             # Common types
└── public/                  # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Admin Panel Features

### Dashboard (`/admin`)
- Overview statistics (users, customers, subscriptions, samples, downloads)
- Quick action buttons
- Recent activity feed (placeholder)

### Sample Management (`/admin/samples`)
- Sample library overview
- Bulk upload (coming in Milestone 2)
- Sample metadata management
- Download statistics

### Customer Management (`/admin/customers`)
- View all business customers
- Search by email, name, or company
- Customer details and subscription status
- Credit balance tracking
- Status management (active/inactive/suspended)

### User Management (`/admin/users`)
- Manage admin users
- System access control
- Admin role assignment

### Analytics (`/admin/analytics`)
- Platform insights (placeholder for future development)

## Security Features

- Row Level Security (RLS) on all tables
- Admin-only route protection
- Server-side authentication checks
- Service role key isolation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Troubleshooting

### "Unauthorized" error when accessing admin panel
- Ensure your user has `is_admin = true` in the users table
- Check that you're logged in to Supabase Auth

### API routes returning 500 errors
- Verify all environment variables are set correctly
- Check that database tables exist and have proper RLS policies
- Review the browser console and server logs for detailed error messages

### Styles not loading
- Run `npm install` to ensure all dependencies are installed
- Clear the `.next` cache: `rm -rf .next` and restart the dev server

## Next Steps

1. Implement authentication pages (login, signup)
2. Add sample bulk upload functionality (Milestone 2)
3. Create user detail pages
4. Build analytics dashboard
5. Add activity logging
6. Implement email notifications
7. Add payment processing integration

## Contributing

This is an internal admin panel. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved

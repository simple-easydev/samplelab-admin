# React + Vite, Supabase only (no Express)

This project uses **React 18 + Vite** and talks to **Supabase directly** from the browser. There is no Express or other API server.

## How it works

- **Auth & data**: The frontend uses `@supabase/supabase-js` with the anon key. All admin data (users, customers, stats, invites) is loaded via Supabase client; RLS policies restrict access to admins.
- **Invite validation**: Unauthenticated users open an invite link; the app calls the Supabase RPC `get_invite_by_token` (migration `20260205000003_get_invite_by_token.sql`) to validate the token and get email/role.
- **Setup admin (from invite)**: Creating the auth user and `users` row requires the service role. That runs in a **Supabase Edge Function** `setup-admin`. Deploy it with:
  ```bash
  supabase functions deploy setup-admin
  ```
  The function uses `SUPABASE_SERVICE_ROLE_KEY` from the project (set automatically in Edge Functions).

## Run the app

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**: Copy `.env.example` to `.env` or `.env.local` and set:
   - `VITE_SUPABASE_URL` – Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – Supabase anon/public key  
   No server-side keys are needed in the frontend repo.

3. **Database**: Apply migrations (including the new RPC) if you haven’t:
   ```bash
   supabase db push
   ```
   or run the SQL in `supabase/migrations/20260205000003_get_invite_by_token.sql` in the Supabase SQL editor.

4. **Dev server**
   ```bash
   npm run dev
   ```
   App runs at http://127.0.0.1:3000 (or the port in `vite.config.js`).

5. **Production**
   ```bash
   npm run build
   npm run preview
   ```
   Serve the `dist/` output with any static host.

## Tests

Jest is set up for `src/` with `@/` → `src/`. The Jest setup mocks `react-router-dom` (no Next.js).

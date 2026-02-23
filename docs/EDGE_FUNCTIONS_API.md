# Edge Functions API Reference

Base URL for all endpoints:

```
https://<PROJECT_REF>.supabase.co/functions/v1
```

Replace `<PROJECT_REF>` with your Supabase project reference (e.g. from Project Settings → General).

All endpoints support **CORS** and accept `Content-Type: application/json`. Use the `Authorization: Bearer <KEY>` header where required.

---

## 1. Sign Up (Customers only)

Creates a **customer** account only. Does not use the admin `users` table: creates an auth user and a row in **`public.customers`** (via trigger). For admin accounts, use the invite flow and **setup-admin** instead. Supabase sends the confirmation email when "Confirm email" is enabled in Auth settings.

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/sign-up` |
| **Auth** | None (public). Consider protecting with rate limiting or CAPTCHA in production. |

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email; trimmed and lowercased. |
| `password` | string | Yes | At least 8 characters. |
| `name` | string | No | Display name; stored in `user_metadata` and `customers.name`. |

**Example**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Jane Doe"
}
```

### Responses

| Status | Description | Body |
|--------|-------------|------|
| **201** | Account created | `{ "success": true, "message": "...", "user_id": "<uuid>" }` |
| **400** | Bad request | `{ "error": "Missing or invalid email" }` or invalid JSON / password / email format |
| **409** | Email already registered | `{ "error": "An account with this email already exists" }` |
| **422** | Auth error (e.g. already registered) | `{ "error": "<message>" }` |
| **500** | Server error | `{ "error": "<message>" }` |

### Example: `fetch`

```javascript
const res = await fetch('https://<PROJECT_REF>.supabase.co/functions/v1/sign-up', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'securePassword123', name: 'Jane' }),
});
const data = await res.json();
```

### Example: Supabase client

```javascript
const { data, error } = await supabase.functions.invoke('sign-up', {
  body: { email: 'user@example.com', password: 'securePassword123', name: 'Jane' },
});
```

---

## 2. Send Invite Email

Sends an admin invite email via Resend. **Caller must be authenticated and have `full_admin` role.**

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/send-invite-email` |
| **Auth** | Required. `Authorization: Bearer <user_jwt>`. User must be `full_admin`. |

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <user_jwt>` (e.g. from `supabase.auth.getSession()`) |
| `Content-Type` | Yes | `application/json` |

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Invitee email. Must not already exist in `users`. |
| `role` | string | Yes | `"full_admin"` or `"content_editor"`. |
| `inviteLink` | string | Yes | Full URL for the invite accept page (e.g. includes token). |
| `inviterName` | string | No | Name of the inviter (shown in email). |
| `message` | string | No | Optional personal message in the email. |

**Example**

```json
{
  "email": "newadmin@example.com",
  "role": "content_editor",
  "inviteLink": "https://yourapp.com/accept-invite?token=abc123",
  "inviterName": "Admin User",
  "message": "Welcome to the team!"
}
```

### Responses

| Status | Description | Body |
|--------|-------------|------|
| **200** | Email sent | `{ "success": true, "messageId": "<resend_id>" }` |
| **400** | Missing required fields | `{ "error": "Missing required fields: email, role, inviteLink" }` |
| **401** | No/invalid token | `{ "error": "Unauthorized" }` or `{ "error": "Invalid or expired session" }` |
| **403** | Not full admin | `{ "error": "Only full admins can send invites" }` |
| **409** | User already exists | `{ "error": "User with this email already exists" }` |
| **500** | Send failed / server error | `{ "error": "...", "details": ... }` or `{ "error": "..." }` |

### Example: Supabase client (with auth)

```javascript
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke('send-invite-email', {
  body: {
    email: 'newadmin@example.com',
    role: 'content_editor',
    inviteLink: 'https://yourapp.com/accept-invite?token=' + inviteToken,
    inviterName: session?.user?.user_metadata?.name,
    message: 'Welcome!',
  },
});
```

---

## 3. Setup Admin

Completes admin onboarding using a valid invite token: creates the auth user, sets admin role and metadata, and marks the invite as used.

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/setup-admin` |
| **Auth** | None. Invite is validated via `token` in the body. |

### Request

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Invite token (e.g. from email link query param). |
| `fullName` | string | Yes | Display name for the new admin. |
| `password` | string | Yes | Password for the new account. |

**Example**

```json
{
  "token": "abc123-invite-token-from-email",
  "fullName": "Jane Admin",
  "password": "securePassword123"
}
```

### Responses

| Status | Description | Body |
|--------|-------------|------|
| **200** | Admin account created | `{ "success": true }` |
| **400** | Missing fields | `{ "error": "Missing required fields" }` |
| **404** | Invalid or already used token | `{ "error": "Invalid or used invitation" }` |
| **410** | Invite expired | `{ "error": "Invitation has expired" }` |
| **500** | Create/update failed | `{ "error": "<message>" }` |

### Example: `fetch`

```javascript
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const res = await fetch('https://<PROJECT_REF>.supabase.co/functions/v1/setup-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    fullName: 'Jane Admin',
    password: formData.password,
  }),
});
const data = await res.json();
```

### Example: Supabase client

```javascript
const { data, error } = await supabase.functions.invoke('setup-admin', {
  body: { token, fullName: 'Jane Admin', password: 'securePassword123' },
});
```

---

## Environment / Secrets

| Function | Required env / secrets |
|----------|------------------------|
| `sign-up` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (set by Supabase). Creates **customers** only (not `users`). |
| `send-invite-email` | `SUPABASE_*` + `RESEND_API_KEY` |
| `setup-admin` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

---

## Frontend integration summary

| Action | Function | Auth | Notes |
|--------|----------|------|--------|
| Customer sign-up | `sign-up` | No | Creates auth user + `customers` row only (no `users` row). |
| Send invite (admin) | `send-invite-email` | User JWT, full_admin | Get session then `supabase.functions.invoke('send-invite-email', { body })`. |
| Accept invite (admin) | `setup-admin` | No | Call from invite page with `token` from URL and user-entered `fullName` + `password`. Creates auth user + `users` row. |

For Supabase JS client, use the same project URL and anon key as in your frontend; for authenticated calls, the client automatically sends the user's JWT when invoking Edge Functions.

# Full sample download — frontend integration

This guide is for the **customer-facing app** (not the admin app). It explains how to request a **short-lived signed URL** for the **full audio file** after the backend **deducts credits** atomically.

**Backend pieces (deployed with this repo):**

- Edge Function: `request-sample-download`
- Database RPC: `request_sample_download_prepare` (invoked only by the Edge Function with the service role)

**Storage:** Full files live in the private bucket **`private-audios`**. The column **`samples.audio_url`** holds the path or public-style URL used to resolve the object for signing. Previews (e.g. `preview_audio_url`) are separate and may stay public.

**Who can download (RPC rules):** Every full download requires (1) a **`customers`** row for the user, (2) at least one **`subscriptions`** row for that customer with `status` or `stripe_status` in **`active`** / **`trialing`**, and (3) **`customers.credit_balance` ≥ `samples.credit_cost`** (no debit when `credit_cost` is 0). Pack **`is_premium`** does not bypass the subscription check.

---

## Prerequisites

1. Migrations applied, including `20260325120000_sample_download_signed_url.sql` and `20260326000000_request_sample_download_subscription_all_packs.sql`.
2. Edge Function `request-sample-download` deployed to the same Supabase project as the frontend.
3. Frontend env (same project):
   - `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` (or your framework’s equivalent)
   - `VITE_SUPABASE_ANON_KEY` (anon key — used as `apikey` on the Functions request; **never** expose the service role key in the browser)

---

## HTTP API

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{SUPABASE_URL}/functions/v1/request-sample-download` |
| **Headers** | `Authorization: Bearer <user_access_token>` |
| | `apikey: <supabase_anon_key>` |
| | `Content-Type: application/json` |

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sampleId` | string (uuid) | Yes | `samples.id` |
| `idempotencyKey` | string (uuid) | No | **Strongly recommended.** Same key for retries of the **same** user action; new key for each new click. |

**Success (200)**

| Field | Type | Description |
|-------|------|-------------|
| `signedUrl` | string | Temporary URL to download the full file (GET). |
| `expiresAt` | string (ISO 8601) | When the signed URL stops working. |
| `filename` | string | Suggested download filename. |
| `creditsCharged` | number | Credits debited this call (`0` on idempotent replay). |
| `replay` | boolean | `true` if this request was a safe retry (no second charge). |

**Error responses**

JSON body typically includes `code` and `message`. Map `code` in your UI.

| HTTP | `code` | When |
|------|--------|------|
| 401 | `not_authenticated` | Missing or invalid JWT |
| 402 | `insufficient_credits` | Not enough `credit_balance` |
| 403 | `customer_not_found` | No `customers` row for this user |
| 403 | `forbidden` | No active subscription (`active` / `trialing` on `subscriptions`) |
| 404 | `sample_not_found` | Sample missing or not published |
| 409 | `idempotency_conflict` | Same idempotency key reused for a **different** sample |
| 503 | `asset_unavailable` | Missing `audio_url`, or signing failed |

Other errors may return `500` with `code: "server_error"` or `bad_request` for malformed input.

---

## Idempotency

- **One new download attempt** → generate a **new** UUID (e.g. `crypto.randomUUID()`).
- **Retries** (network error, timeout, 5xx) for the **same** button click → send the **same** `idempotencyKey`.
- **New click** on Download → **new** `idempotencyKey`.

This avoids double-charging credits when the client retries after the server already debited.

---

## Integration steps

1. Ensure the user is logged in (`supabase.auth.getSession()` or equivalent).
2. On “Download full sample”, create `idempotencyKey = crypto.randomUUID()` and keep it in state until the request finishes (success or non-retryable error).
3. `POST` to the Functions URL with `Authorization: Bearer <session.access_token>` and `apikey: <anon key>`.
4. On **200**, open `signedUrl` for download:
   - Either `window.location.href = signedUrl` / `window.open(signedUrl)` for a simple GET download, or
   - `fetch(signedUrl)` → blob → object URL + hidden `<a download>` for more control.
5. On **402 / 403 / 404**, show a clear message; do not retry blindly with the same idempotency key unless you intend a replay-safe retry (see above).
6. Optionally refresh UI credit balance after success (e.g. refetch `customers` or your profile endpoint).

---

## Example: `fetch` (framework-agnostic)

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function requestFullSampleDownload(
  accessToken: string,
  sampleId: string,
  idempotencyKey: string,
) {
  const res = await fetch(
    `${supabaseUrl}/functions/v1/request-sample-download`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ sampleId, idempotencyKey }),
    },
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : json.code ?? res.statusText,
    );
  }

  return json as {
    signedUrl: string;
    expiresAt: string;
    filename: string;
    creditsCharged: number;
    replay: boolean;
  };
}
```

## Example: Supabase client `invoke`

```ts
const { data, error } = await supabase.functions.invoke("request-sample-download", {
  body: { sampleId, idempotencyKey },
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

If `invoke` wraps errors differently by version, prefer `fetch` for explicit status handling.

---

## Optional: Edge environment (server-side)

Configured in the Supabase dashboard for the Edge Function, not in the browser:

| Variable | Purpose |
|----------|---------|
| `SAMPLE_DOWNLOAD_URL_TTL_SEC` | Signed URL lifetime (default **180** seconds). |
| `PRIVATE_AUDIOS_BUCKET` | Override bucket name if not `private-audios`. |

---

## Security notes

- Only the **anon** key and **user JWT** belong in the frontend. **Service role** must never ship to the client.
- Signed URLs are **time-limited**; treat them like secrets for the short window before expiry.
- Full-file access is **gated** by credits + rules in the RPC; do not bypass the Edge Function with direct Storage URLs for paid content.

---

## Troubleshooting: `asset_unavailable` / "Object not found"

The Edge Function debits credits in the database **before** it asks Storage for a signed URL. If signing fails with **"Object not found"** (or similar), Storage has **no object** at the bucket + path derived from **`samples.audio_url`**.

**Checklist**

1. **SQL:** `SELECT id, name, audio_url FROM samples WHERE id = '<sampleId>';`
2. **Supabase Dashboard → Storage:** Open the bucket named in the URL (often **`private-audios`**, or an older name embedded in the URL such as **`audio-samples`**).
3. Confirm the **object path** exists (e.g. `samples/1739….wav`). Path must match exactly (case-sensitive).
4. **Mismatch:** If the file was moved to **`private-audios`** but **`audio_url`** still points at **`/object/public/audio-samples/...`**, signing uses **`audio-samples`** (from the URL). Either **update `audio_url`** in the DB to the new location or **copy the object** into the bucket/path the row references.
5. **Path-only `audio_url`:** If the value has no `https://`:
   - `samples/foo.wav` → object key **`samples/foo.wav`** in bucket **`private-audios`** (or `PRIVATE_AUDIOS_BUCKET`).
   - **`private-audios/gold-dust-piano-chops-pack/.../file.wav`** → bucket **`private-audios`**, key **`gold-dust-piano-chops-pack/.../file.wav`** (leading bucket segment is stripped; it must not be duplicated inside `.from(bucket)`).

**Edge Function logs** (Dashboard → Functions → Logs) include **`bucket`**, **`objectPath`**, and a snippet of **`audio_url`** for failed sign attempts—use that to compare with Storage.

---

## Related

- Migration: `supabase/migrations/20260325120000_sample_download_signed_url.sql`
- Edge Function: `supabase/functions/request-sample-download/index.ts`

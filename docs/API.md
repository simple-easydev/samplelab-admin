# SampleLab Admin — RPC API Reference

All endpoints are Supabase RPC functions. Call them with the Supabase client:

```ts
const { data, error } = await supabase.rpc('function_name', { param1: value1, ... });
```

Authentication: use an authenticated Supabase client unless noted. RLS runs as the caller (`SECURITY INVOKER`) unless stated otherwise.

---

## Library (Admin)

### get_all_packs

Returns all packs with creator, category, genres, and sample count. For admin library Packs tab.

| | |
|---|---|
| **Method** | `get_all_packs` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Pack ID |
| name | text | Pack name |
| creator_id | uuid | Creator ID (nullable) |
| category_id | uuid | Category ID (nullable) |
| creator_name | text | Creator display name |
| category_name | text | Category name (or "Uncategorized") |
| genres | text[] | Genre names for this pack |
| tags | text[] | Pack tags |
| samples_count | bigint | Count of Active/Disabled samples |
| download_count | integer | Pack download count |
| status | text | `"Draft"` \| `"Published"` \| `"Disabled"` |
| cover_url | text | Cover image URL (nullable) |
| created_at | timestamptz | Created at |
| is_premium | boolean | Premium flag |

**Example**

```ts
const { data, error } = await supabase.rpc('get_all_packs');
```

---

### get_all_samples

Returns all samples with pack, creator, genre, and stem count. For admin library Samples tab.

| | |
|---|---|
| **Method** | `get_all_samples` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Sample ID |
| name | text | Sample name |
| preview_audio_url | text | URL to the sample preview audio file |
| pack_id | uuid | Pack ID |
| pack_name | text | Pack name |
| creator_name | text | Creator display name |
| genre | text | First pack genre name |
| bpm | integer | BPM (nullable) |
| key | text | Musical key (nullable) |
| type | text | `"Loop"` \| `"One-shot"` |
| download_count | integer | Download count |
| status | text | `"Active"` \| `"Disabled"` \| `"Deleted"` |
| has_stems | boolean | Whether sample has stems |
| stems_count | bigint | Number of stem files |
| created_at | timestamptz | Created at |
| metadata | jsonb | Optional: `{ "bars": number[], "duration_seconds": number }` for waveform |
| thumbnail_url | text | Optional URL to sample thumbnail image (nullable) |

**Example**

```ts
const { data, error } = await supabase.rpc('get_all_samples');
```

---

### get_all_genres

Returns all genres with pack and sample counts (and optional thumbnail). For admin library Genres tab.

| | |
|---|---|
| **Method** | `get_all_genres` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Genre ID |
| name | text | Genre name |
| description | text | Description (nullable) |
| is_active | boolean | Active flag |
| created_at | timestamptz | Created at |
| packs_count | bigint | Packs using this genre |
| samples_count | bigint | Samples in those packs (Active/Disabled only) |
| thumbnail_url | text | Thumbnail image URL (nullable) |

**Example**

```ts
const { data, error } = await supabase.rpc('get_all_genres');
```

---

### get_all_categories

Returns all categories with pack count. For admin library Categories tab.

| | |
|---|---|
| **Method** | `get_all_categories` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Category ID |
| name | text | Category name |
| description | text | Description (nullable) |
| is_active | boolean | Active flag |
| created_at | timestamptz | Created at |
| packs_count | bigint | Packs in this category |

**Example**

```ts
const { data, error } = await supabase.rpc('get_all_categories');
```

---

### get_all_moods

Returns all moods. For admin library Moods tab.

| | |
|---|---|
| **Method** | `get_all_moods` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Mood ID |
| name | text | Mood name |
| is_active | boolean | Active flag |
| created_at | timestamptz | Created at |

**Example**

```ts
const { data, error } = await supabase.rpc('get_all_moods');
```

---

## Creators

### get_creators_with_counts

Returns active creators with pack and sample counts. Supports search and pagination.

| | |
|---|---|
| **Method** | `get_creators_with_counts` |
| **Parameters** | Optional object |
| **Auth** | `anon`, `authenticated`, `service_role` |

**Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| p_search | text | null | Filter by creator name (ILIKE) |
| p_limit | int | 100 | Max rows (capped at 1000) |
| p_offset | int | 0 | Offset for pagination |

**Response:** Array of rows

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Creator ID |
| name | text | Creator name |
| avatar_url | text | Avatar URL (nullable) |
| packs_count | bigint | Pack count |
| samples_count | bigint | Sample count |

**Example**

```ts
const { data, error } = await supabase.rpc('get_creators_with_counts', {
  p_search: 'Mike',
  p_limit: 20,
  p_offset: 0,
});
```

---

### get_creator_by_id

Returns one active creator by ID as a single JSONB object with nested packs, samples, genres, etc. Returns `null` if not found or inactive.

| | |
|---|---|
| **Method** | `get_creator_by_id` |
| **Parameters** | Object (required) |
| **Auth** | `authenticated`, `service_role` (typical) |

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| p_creator_id | uuid | Creator ID |

**Response:** `jsonb` (single object or `null`)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Creator ID |
| name | text | Creator name |
| description | text | Bio |
| avatar_url | text | Avatar URL |
| packs_count | bigint | Pack count |
| samples_count | bigint | Sample count |
| tags | string[] | Distinct tags from packs |
| genres | array | `[{ id, name }, ...]` |
| categories | array | `[{ id, name }, ...]` |
| packs | array | Pack rows (id, name, description, cover_url, …) |
| samples | array | Sample rows (id, pack_id, name, audio_url, preview_audio_url, …) |
| similar_creators | array | `[{ id, name, avatar_url }, ...]` (up to 6) |

**Example**

```ts
const { data, error } = await supabase.rpc('get_creator_by_id', {
  p_creator_id: 'uuid-here',
});
// data is one object or null
```

---

### get_pack_by_id

Returns one pack by ID as a single JSONB object with pack fields, samples array, and similar_packs array. For the pack detail page. Returns `null` if the pack is not found.

| | |
|---|---|
| **Method** | `get_pack_by_id` |
| **Parameters** | Object (required) |
| **Auth** | `anon`, `authenticated`, `service_role` (RLS applies: published packs for anon; admins see all) |

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| p_pack_id | uuid | Pack ID |

**Response:** `jsonb` (single object or `null`)

**Top-level pack fields (hero and metadata):**

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Pack ID |
| name | text | Pack name |
| description | text | Pack description (nullable) |
| cover_url | text | Cover image URL (nullable) |
| creator_id | uuid | Creator ID (nullable) |
| creator_name | text | Creator display name |
| category_id | uuid | Category ID (nullable) |
| category_name | text | Category name (or "Uncategorized") |
| genres | string[] | Genre names for this pack |
| tags | string[] | Pack tags |
| is_premium | boolean | Premium flag |
| samples_count | bigint | Count of Active/Disabled samples in this pack |
| download_count | integer | Pack download count |
| status | text | `"Draft"` \| `"Published"` \| `"Disabled"` |
| created_at | timestamptz | Created at |

**samples** (array): One entry per sample in this pack (Active/Disabled only).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Sample ID |
| pack_id | uuid | Pack ID |
| name | text | Sample name |
| audio_url | text | URL to the full sample audio file (credit-gated download) |
| preview_audio_url | text | URL for preview playback (falls back to `audio_url` when unset) |
| bpm | integer | BPM (nullable) |
| key | text | Musical key (nullable) |
| type | text | `"Loop"` \| `"One-shot"` |
| length | text | Duration (e.g. "2:30") (nullable) |
| file_size_bytes | bigint | File size (nullable) |
| credit_cost | integer | Credit cost (nullable) |
| status | text | `"Active"` \| `"Disabled"` |
| has_stems | boolean | Whether sample has stems |
| download_count | integer | Download count |
| created_at | timestamptz | Created at |
| creator_name | text | Pack creator name (for row display) |
| thumbnail_url | text | Optional URL to sample thumbnail image (nullable) |
| metadata | jsonb | Optional: `{ "bars": number[], "duration_seconds": number }` for waveform |

**similar_packs** (array): Up to 6 packs—same creator, same category, or overlapping genres; excludes current pack; ordered by relevance (same creator first, then same category).

Each element has the same shape as Packs tab rows: `id`, `name`, `creator_id`, `category_id`, `creator_name`, `category_name`, `genres` (text[]), `tags`, `samples_count`, `download_count`, `status`, `cover_url`, `created_at`, `is_premium`.

**Example**

```ts
const { data, error } = await supabase.rpc('get_pack_by_id', {
  p_pack_id: packId,
});
// data is one object or null; use data.samples and data.similar_packs for lists
```

---

## Auth & Admin

### get_invite_by_token

Validates an admin invite token and returns email, role, and expiry. Used on the invite setup page before login. **Callable by `anon`.**

| | |
|---|---|
| **Method** | `get_invite_by_token` |
| **Parameters** | Object (required) |
| **Auth** | `anon`, `authenticated` |
| **Security** | `SECURITY DEFINER` |

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| p_token | text | Invite token from URL |

**Response:** Table (0 or 1 row)

| Field | Type | Description |
|-------|------|-------------|
| email | text | Invited email |
| role | text | Invite role |
| expires_at | timestamptz | Expiry time |

Returns no rows if token is invalid or already used.

**Example**

```ts
const { data: rows, error } = await supabase.rpc('get_invite_by_token', {
  p_token: tokenFromUrl,
});
const invite = Array.isArray(rows) ? rows[0] : null;
```

---

## Billing

### get_stripe_products

Returns active plan tiers. Optionally filter to plans visible on onboarding.

| | |
|---|---|
| **Method** | `get_stripe_products` |
| **Parameters** | Optional object |
| **Auth** | `anon`, `authenticated`, `service_role` |
| **Security** | `SECURITY DEFINER` |

**Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| visible_onboarding | boolean | null | If `true`, only plans with `visible_onboarding = true` |

**Response:** `jsonb`

```json
{
  "plans": [ /* plan_tiers rows */ ]
}
```

**Example**

```ts
// All active plans
const { data } = await supabase.rpc('get_stripe_products');

// Onboarding-only plans
const { data } = await supabase.rpc('get_stripe_products', {
  visible_onboarding: true,
});
```

---

### get_my_billing_info

Returns the current user’s customer row and latest active/trialing subscription. Uses JWT (`auth.uid()`).

| | |
|---|---|
| **Method** | `get_my_billing_info` |
| **Parameters** | None |
| **Auth** | `authenticated`, `service_role` |

**Response:** `jsonb`

```json
{
  "customer": { /* customers row or null */ },
  "subscription": { /* subscriptions row or null */ }
}
```

**Example**

```ts
const { data, error } = await supabase.rpc('get_my_billing_info');
```

---

## Summary

| RPC | Purpose |
|-----|--------|
| `get_all_packs` | All packs (admin library) |
| `get_all_samples` | All samples (admin library) |
| `get_all_genres` | All genres with counts |
| `get_all_categories` | All categories with pack count |
| `get_all_moods` | All moods |
| `get_creators_with_counts` | Creators list with counts (search, pagination) |
| `get_creator_by_id` | Single creator detail (nested packs, samples, etc.) |
| `get_pack_by_id` | Single pack detail (pack fields, samples[], similar_packs[]) |
| `get_similar_samples_by_downloaded_sample` | Similar samples for a downloaded seed sample (v1: same pack) |
| `get_similar_packs_by_liked_pack` | Similar packs for a pack the user liked (`liked_pack` + `similarities`) |
| `get_invite_by_token` | Validate admin invite token (anon) |
| `get_stripe_products` | Plan tiers (optional onboarding filter) |
| `get_my_billing_info` | Current user billing (customer + subscription) |

---

## Samples (Personalization)

### get_similar_samples_by_downloaded_sample

Returns “similar” samples to the caller’s **most recently downloaded** sample.

Current similarity rules (v1):

- Other samples in the **same pack** as the seed sample
- Excludes the seed sample itself

| | |
|---|---|
| **Method** | `get_similar_samples_by_downloaded_sample` |
| **Parameters** | Object (required) |
| **Auth** | `authenticated`, `service_role` |

**Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| p_limit | int | 24 | Max rows (clamped to 1–100) |

**Response:** Single JSON object (`jsonb`), or `null` if the user is not authenticated or has no qualifying download in `credit_activity`.

```json
{
  "seed_sample": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "sample title"
  },
  "similarities": [
    {
      "id": "…",
      "name": "…",
      "preview_audio_url": "…",
      "pack_id": "…",
      "pack_name": "…",
      "creator_id": "…",
      "creator_name": "…",
      "genre": "…",
      "bpm": 140,
      "key": "Am",
      "type": "One-shot",
      "download_count": 0,
      "status": "Active",
      "has_stems": false,
      "stems_count": 0,
      "created_at": "…",
      "metadata": {},
      "thumbnail_url": null,
      "credit_cost": 1
    }
  ]
}
```

**Example**

```ts
const { data, error } = await supabase.rpc(
  'get_similar_samples_by_downloaded_sample',
  { p_limit: 24 }
);
// data: { seed_sample: { id, name }, similarities: [...] } | null
```

---

## Packs (Personalization)

### get_similar_packs_by_liked_pack

Returns packs similar to a pack the user **liked** on `user_pack_likes`, plus the liked pack’s **id** and **name**.

Similarity rules match `get_pack_by_id` → `similar_packs`: same creator, same category, or overlapping genres. Only **`Published`** packs appear in `similarities`.

| | |
|---|---|
| **Method** | `get_similar_packs_by_liked_pack` |
| **Parameters** | Object (optional) |
| **Auth** | `authenticated`, `service_role` |
| **Security** | `SECURITY DEFINER` (verifies the like row belongs to `auth.uid()`) |

**Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| p_pack_id | uuid | null | Liked pack to use as the seed. Must exist in `user_pack_likes` for the caller. If omitted, uses the **most recently** liked pack. |
| p_limit | int | 6 | Max similar packs (clamped to 1–100) |

**Response:** `jsonb` or `null` if unauthenticated, no likes, unknown pack, or `p_pack_id` is not liked by the caller.

```json
{
  "liked_pack": { "id": "uuid", "name": "Pack title" },
  "similarities": [
    {
      "id": "uuid",
      "name": "…",
      "creator_id": "uuid",
      "category_id": "uuid",
      "creator_name": "…",
      "category_name": "…",
      "genres": ["…"],
      "tags": ["…"],
      "samples_count": 0,
      "download_count": 0,
      "status": "Published",
      "cover_url": "…",
      "created_at": "…",
      "is_premium": false
    }
  ]
}
```

**Example**

```ts
// Use the caller’s most recent liked pack as the seed
const { data, error } = await supabase.rpc('get_similar_packs_by_liked_pack', {
  p_limit: 6,
});

// Or pin a specific liked pack
const { data, error } = await supabase.rpc('get_similar_packs_by_liked_pack', {
  p_pack_id: likedPackId,
  p_limit: 6,
});
```

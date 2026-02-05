# SampleLab Data Structure & Hierarchy

This document defines the core data architecture for the SampleLab marketplace.

## Core Principle: Pack-First Architecture

```
Pack (1) ──── Contains ──── (1+) Samples
```

### The Golden Rule

**Every sample MUST belong to a pack — no exceptions.**

Even if you're selling a single one-shot or one loop, the marketplace treats it as:
- **Pack with 1 Sample**

This keeps the system:
- ✅ Clean and consistent
- ✅ Scalable
- ✅ Aligned with industry standards (Splice, WAVS, Loopcloud)

## Examples

### Single One-Shot Sample Product
```
Pack: "Kick Drum Heavy"
├── Creator: Producer Mike
├── Cover Art: kick_cover.jpg
├── Price: $2.99
└── Contains: 1 Sample
    └── "Heavy Kick.wav" (One-shot, 120 BPM, Cmaj)
```

**User sees:**
- Pack tile with cover art, title, "1 sample"
- Preview button plays the sample
- Inside pack detail: one sample row → play + download

### Single Loop Product
```
Pack: "Trap Hi-Hat Loop"
├── Creator: Beat Master
├── Cover Art: hihat_cover.jpg
├── Price: $1.99
└── Contains: 1 Sample
    └── "Trap HH.wav" (Loop, 140 BPM, Am)
```

### Standard Multi-Sample Pack
```
Pack: "Lo-Fi Drums Vol. 1"
├── Creator: Rhythm King
├── Cover Art: lofi_cover.jpg
├── Price: $14.99
└── Contains: 45 Samples
    ├── "Kick_01.wav"
    ├── "Kick_02.wav"
    ├── "Snare_01.wav"
    └── ... (42 more)
```

## Database Schema Implications

### Packs Table
```sql
CREATE TABLE packs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES creators(id),
  cover_art_url TEXT,
  price DECIMAL(10,2),
  description TEXT,
  genre TEXT,
  category TEXT,
  tags TEXT[],
  status TEXT CHECK (status IN ('Published', 'Disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Samples Table
```sql
CREATE TABLE samples (
  id UUID PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,  -- REQUIRED
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  waveform_url TEXT,
  type TEXT CHECK (type IN ('Loop', 'One-shot', 'Stem')),
  bpm INTEGER,
  key TEXT,
  duration_seconds DECIMAL(10,2),
  file_size_bytes INTEGER,
  status TEXT CHECK (status IN ('Active', 'Disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Enforce: sample MUST belong to a pack
  CONSTRAINT sample_must_have_pack CHECK (pack_id IS NOT NULL)
);
```

## Admin Workflow

### Creating Content

#### Option 1: Pack-First (Recommended)
1. Admin creates a Pack
2. Admin uploads sample(s) to that pack
3. Pack is published

#### Option 2: Sample-First (Must Select Pack)
1. Admin clicks "Add Sample"
2. **Required dropdown**: Select existing pack OR create new pack
3. Upload sample file and metadata
4. Sample is added to selected pack

### Key Points:
- ❌ Cannot create orphaned samples
- ✅ When deleting a pack, all samples cascade delete (or bulk reassign)
- ✅ Sample count badge shows "1 sample" or "45 samples" consistently
- ✅ Single-sample packs are treated exactly like multi-sample packs

## UI/UX Guidelines

### Pack Tile Display
```
┌─────────────────────────┐
│   [Cover Art Image]     │
│                         │
│  Pack Title             │
│  by Creator Name        │
│  🎵 1 sample / 45 samples│
│  [▶ Preview]            │
└─────────────────────────┘
```

### Pack Detail Page
- Header: Pack name, creator, cover art, description
- Sample list: Table/grid of all samples in pack
  - For 1-sample packs: Shows 1 row
  - For multi-sample packs: Shows N rows
- Each sample: Play, download, metadata (BPM, key, type)

### Admin Library Page
- **Packs Tab**: Shows all packs (including 1-sample packs)
- **Samples Tab**: Shows all samples with pack relationship
  - Pack column is **always** populated (never null)
  - Click pack name → navigate to pack detail

## Frontend Representation

### Pack Object
```typescript
interface Pack {
  id: string;
  name: string;
  creator: {
    id: string;
    name: string;
  };
  coverArtUrl: string;
  price: number;
  sampleCount: number;  // Can be 1 or more
  status: 'Published' | 'Disabled';
  genre: string;
  category: string;
  tags: string[];
}
```

### Sample Object
```typescript
interface Sample {
  id: string;
  packId: string;  // REQUIRED - never null/undefined
  pack: {          // Populated for display
    id: string;
    name: string;
  };
  name: string;
  fileUrl: string;
  type: 'Loop' | 'One-shot' | 'Stem';
  bpm?: number;
  key?: string;
  status: 'Active' | 'Disabled';
}
```

## Migration & Data Integrity

If migrating from a system with orphaned samples:

```sql
-- Find orphaned samples
SELECT * FROM samples WHERE pack_id IS NULL;

-- Strategy 1: Create auto-packs for orphaned samples
INSERT INTO packs (id, name, creator_id, status)
SELECT 
  gen_random_uuid(),
  CONCAT('Auto-Pack: ', s.name),
  s.creator_id,
  'Disabled'
FROM samples s
WHERE s.pack_id IS NULL;

-- Strategy 2: Assign to default pack
UPDATE samples
SET pack_id = '<default_pack_id>'
WHERE pack_id IS NULL;
```

## API Endpoints

### Get Pack with Samples
```
GET /api/packs/:id
Response: {
  pack: { ... },
  samples: [ ... ]  // Array can have 1+ items
}
```

### Get Sample (Always includes pack reference)
```
GET /api/samples/:id
Response: {
  id: "...",
  packId: "...",
  pack: { id: "...", name: "..." },
  name: "...",
  ...
}
```

### Create Sample (Pack is required)
```
POST /api/samples
Body: {
  packId: "...",  // REQUIRED
  name: "...",
  fileUrl: "...",
  ...
}
```

## Benefits of This Architecture

1. **Consistency**: All products follow same pattern
2. **Simplicity**: One data model for all cases
3. **Scalability**: Easy to add samples to any pack
4. **Industry Standard**: Matches Splice, WAVS, Loopcloud
5. **Referential Integrity**: Foreign key ensures data validity
6. **Business Logic**: Pricing, licensing, bundles all work at pack level

## Anti-Patterns to Avoid

❌ Creating samples without packs
❌ Nullable pack_id in samples table
❌ Special case logic for "single sample products"
❌ Separate UI flows for packs vs. samples
❌ Different frontend components for 1-sample vs. multi-sample packs

## Summary

```
Every sample belongs to a pack.
Single sample? → Still a pack (with 1 sample).
This is the way. ✨
```

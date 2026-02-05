# Stems Logic - Complete Implementation Guide

## Overview

Stems are multi-track audio files that belong to a parent sample (usually a loop or composition). This guide explains the complete stems system implementation.

## Core Concepts

### What Are Stems?

**Stems** are individual instrument/element tracks that make up a complete mix:
- **Drum Stem** - Isolated drum track
- **Bass Stem** - Isolated bass track
- **Melody Stem** - Isolated melody track
- **Vocal Stem** - Isolated vocal track

**Example:**
```
Parent Sample: "Trap Beat Loop" (the mixed/mastered version)
  └── Stems Bundle:
      ├── drums.wav
      ├── bass.wav
      ├── melody.wav
      └── vocals.wav
```

### Key Rules (As Per Requirements)

✅ **Stems belong to a parent sample** - Not independent entities  
✅ **A sample can have 0-N stem files** - Optional, multiple files allowed  
✅ **Not all samples have stems** - Only loops/compositions typically have stems  
✅ **Users never browse stems independently** - Stems only accessed from parent sample  
✅ **Stems are purchased from parent sample** - Additional action, not separate product  
✅ **Stems cost more credits** - Additional cost (e.g., +5 credits)  
✅ **Sample cards show "Download Stems"** - Additional action button  

## Database Schema

### Samples Table
```sql
CREATE TABLE samples (
  id UUID PRIMARY KEY,
  pack_id UUID REFERENCES packs(id),
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,           -- Parent sample file
  type TEXT CHECK (type IN ('Loop', 'One-shot')),  -- NOTE: 'Stem' is NOT a type
  credit_cost INTEGER,                -- Cost for parent sample only
  has_stems BOOLEAN DEFAULT FALSE,    -- Flag: does this sample have stems?
  ...
);
```

### Stems Table
```sql
CREATE TABLE stems (
  id UUID PRIMARY KEY,
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,  -- Parent sample
  name TEXT NOT NULL,                 -- e.g., "drums.wav", "bass.wav"
  audio_url TEXT NOT NULL,            -- Stem file URL in storage
  file_size_bytes BIGINT,
  created_at TIMESTAMP
);
```

### Relationship
```
samples (1) ──< has_stems >── (0..N) stems
```

One sample can have zero or many stem files.

## Credit Cost Structure

### Standard Pack
```
One-shot sample:    2 credits
Loop sample:        3 credits
+ Stems bundle:     5 credits (if has_stems = true)

Examples:
- One-shot (no stems):    2 credits total
- Loop (no stems):        3 credits total
- Loop + stems:           8 credits total (3 + 5)
```

### Premium Pack
```
One-shot sample:    8 credits
Loop sample:        10 credits
+ Stems bundle:     5 credits (if has_stems = true)

Examples:
- Premium one-shot (no stems):  8 credits total
- Premium loop (no stems):      10 credits total
- Premium loop + stems:         15 credits total (10 + 5)
```

### Configuration (`src/config/credits.ts`)
```typescript
export const CREDIT_COSTS = {
  standard: {
    'One-shot': 2,
    'Loop': 3,
  },
  premium: {
    'One-shot': 8,
    'Loop': 10,
  }
};

export const STEMS_BUNDLE_COST = 5;

// Calculate total cost
export function calculateTotalCreditCost(
  sampleType: 'One-shot' | 'Loop',
  isPremium: boolean,
  hasStems: boolean,
  manualOverride?: number
): number {
  const sampleCost = calculateSampleCreditCost(sampleType, isPremium, manualOverride);
  const stemsCost = hasStems ? STEMS_BUNDLE_COST : 0;
  return sampleCost + stemsCost;
}
```

## Admin Workflow (CreatePack Page)

### Step 1: Upload Parent Sample
```tsx
<Input type="file" accept="audio/*" multiple onChange={handleAudioUpload} />
```

### Step 2: Set Sample Metadata
```tsx
<Input placeholder="Sample name" />
<Input placeholder="BPM" type="number" />
<Input placeholder="Key" />
<Dropdown> {/* Type: Loop or One-shot */}
  <Option>Loop</Option>
  <Option>One-shot</Option>
</Dropdown>
```

### Step 3: Toggle "Has Stems?"
```tsx
<Button 
  variant={sample.hasStems ? "default" : "outline"}
  onClick={() => handleSampleChange(sample.id, "hasStems", !sample.hasStems)}
>
  {sample.hasStems ? "Yes" : "No"}
</Button>
```

### Step 4: Upload Stem Files (If Yes)
```tsx
{sample.hasStems && (
  <Input 
    type="file" 
    accept="audio/*" 
    multiple 
    onChange={(e) => handleStemUpload(sample.id, e)} 
  />
)}
```

### Step 5: Preview (Quality Check)
```tsx
<div>
  <Play /> {sample.name}
  {sample.hasStems && (
    <Badge>{sample.stemFiles.length} stems</Badge>
  )}
</div>
```

## Storage Structure

```
Supabase Storage: audio-samples/
├── samples/
│   ├── 1738772800000-abc123.wav  ← Parent sample
│   ├── 1738772801000-def456.wav  ← Parent sample
│   └── 1738772802000-ghi789.wav  ← Parent sample
└── stems/
    ├── 1738772803000-jkl012.wav  ← Stem file (drums)
    ├── 1738772804000-mno345.wav  ← Stem file (bass)
    ├── 1738772805000-pqr678.wav  ← Stem file (melody)
    └── 1738772806000-stu901.wav  ← Stem file (vocals)
```

## User-Facing Display (Frontend App)

### Sample Card
```
┌──────────────────────────┐
│ [Preview Image]          │
│                          │
│ Trap Beat Loop           │
│ By Producer Mike         │
│                          │
│ 140 BPM • Am • 2:30      │
│                          │
│ Loop • 3 credits         │
│                          │
│ [▶ Preview]              │
│ [⬇ Download]             │  ← 3 credits
│ [⬇ Download Stems] 🔊    │  ← +5 credits (total: 8)
└──────────────────────────┘
```

### Detail View
```
Sample: Trap Beat Loop
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[▶ Play Preview]

Download Options:
┌────────────────────────────────┐
│ ⬇ Main Sample (WAV)            │
│   • 140 BPM • Am • 2:30        │
│   • 3 credits                  │
│   [Download]                   │
├────────────────────────────────┤
│ 🔊 Stems Bundle (4 files)      │
│   • drums.wav                  │
│   • bass.wav                   │
│   • melody.wav                 │
│   • vocals.wav                 │
│   • +5 credits                 │
│   [Download Stems]             │
└────────────────────────────────┘

Total: 8 credits (or 3 for main only)
```

### Checkout Summary
```
Cart:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trap Beat Loop (main)       3 credits
Trap Beat Loop (stems)    + 5 credits
                          ──────────
Total:                      8 credits
```

## Implementation Status

### ✅ Database Schema
- [x] `samples` table with `has_stems` boolean flag
- [x] `stems` table with `sample_id` foreign key
- [x] RLS policies for stems visibility
- [x] Cascade delete (delete sample → delete stems)

### ✅ Admin Upload (CreatePack Page)
- [x] "Has stems?" toggle for each sample
- [x] Multiple stem file upload
- [x] Stem files stored in `stemFiles` array
- [x] Stem files displayed with file names
- [x] Upload to Supabase storage (`stems/` folder)
- [x] Database creation in `stems` table

### ✅ Credit Cost System
- [x] `STEMS_BUNDLE_COST = 5` in configuration
- [x] `calculateTotalCreditCost()` includes stems
- [x] Separate from parent sample cost

### ⚠️ Display/UI (Partially Implemented)
- [ ] Show "Download Stems" button on sample cards (Frontend)
- [ ] Display stem file count/size in samples table
- [ ] Show total cost breakdown (sample + stems)
- [x] Stems badge in Quality Check preview

### ⚠️ Download Logic (Not Yet Implemented)
- [ ] Download single stem file
- [ ] Download all stems as ZIP bundle
- [ ] Credit deduction for stems download
- [ ] Track stems downloads separately

## API Endpoints Needed (Frontend)

### Get Sample with Stems
```typescript
GET /api/samples/:id

Response:
{
  "id": "uuid",
  "name": "Trap Beat Loop",
  "type": "Loop",
  "credit_cost": 3,
  "has_stems": true,
  "stems": [
    { "id": "uuid", "name": "drums.wav", "audio_url": "..." },
    { "id": "uuid", "name": "bass.wav", "audio_url": "..." },
    { "id": "uuid", "name": "melody.wav", "audio_url": "..." },
    { "id": "uuid", "name": "vocals.wav", "audio_url": "..." }
  ],
  "stems_bundle_cost": 5,
  "total_cost_with_stems": 8
}
```

### Download Sample
```typescript
POST /api/downloads/sample/:id
{
  "include_stems": false  // Download main sample only (3 credits)
}
```

### Download Stems Bundle
```typescript
POST /api/downloads/sample/:id/stems
{
  // Downloads all stems as ZIP (5 credits)
}
```

## Database Queries

### Get Sample with Stems Count
```sql
SELECT 
  s.*,
  COUNT(st.id) as stems_count
FROM samples s
LEFT JOIN stems st ON st.sample_id = s.id
WHERE s.id = 'sample-uuid'
GROUP BY s.id;
```

### Get All Stems for a Sample
```sql
SELECT * 
FROM stems 
WHERE sample_id = 'sample-uuid'
ORDER BY name;
```

### Get Samples with Stems in Pack
```sql
SELECT 
  s.id,
  s.name,
  s.has_stems,
  COUNT(st.id) as stems_count,
  ARRAY_AGG(st.name) as stem_names
FROM samples s
LEFT JOIN stems st ON st.sample_id = s.id
WHERE s.pack_id = 'pack-uuid'
GROUP BY s.id, s.name, s.has_stems;
```

## Sample Types

### ❌ Incorrect Understanding
```
Sample Types: Loop, One-shot, Stem
```
This is WRONG. "Stem" is not a sample type.

### ✅ Correct Understanding
```
Sample Types: Loop, One-shot
Attachment: Stems bundle (0-N files)
```

Stems are attachments to samples, not samples themselves.

## Use Cases

### Use Case 1: One-Shot Sample (No Stems)
```
Sample: 808 Bass Hit
Type: One-shot
Has Stems: No
Cost: 2 credits
Download: Single file
```

### Use Case 2: Loop Sample (No Stems)
```
Sample: Drum Loop
Type: Loop
Has Stems: No
Cost: 3 credits
Download: Single file
```

### Use Case 3: Loop Sample (With Stems)
```
Sample: Trap Beat Loop
Type: Loop
Has Stems: Yes (4 stems)
Cost: 3 credits (main) + 5 credits (stems) = 8 total
Download Options:
  - Main sample only (3 credits)
  - Main + stems bundle (8 credits)
```

### Use Case 4: Premium Loop (With Stems)
```
Sample: Premium Trap Beat
Type: Loop
Pack: Premium
Has Stems: Yes (6 stems)
Cost: 10 credits (main) + 5 credits (stems) = 15 total
Download Options:
  - Main sample only (10 credits)
  - Main + stems bundle (15 credits)
```

## Admin Panel Features

### CreatePack Page - Current Implementation

#### ✅ What's Working
1. **Has stems? toggle** - Per sample
2. **Upload multiple stem files** - Drag/drop or file picker
3. **Display stem file names** - Shows what was uploaded
4. **Quality Check preview** - Shows stem count badge
5. **Upload to storage** - Stores in `audio-samples/stems/`
6. **Database creation** - Creates records in `stems` table

#### ⚠️ What Could Be Enhanced
1. **Credit cost preview** - Show "Sample: 3 credits, Stems: +5 credits"
2. **Stem file validation** - Ensure matching length/BPM
3. **Stem naming convention** - Suggest drum, bass, melody, etc.
4. **Individual stem preview** - Play each stem separately
5. **Stems requirement** - Enforce stems for certain sample types

### SamplesTab - Needed Enhancements

Add "Stems" column to table:
```tsx
<TableHead>Stems</TableHead>
...
<TableCell>
  {sample.has_stems ? (
    <Badge variant="secondary">
      {sample.stems_count} files
    </Badge>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>
```

## Frontend App Implementation

### Sample Card Component
```tsx
<SampleCard sample={sample}>
  {/* Main info */}
  <h3>{sample.name}</h3>
  <p>{sample.bpm} BPM • {sample.key}</p>
  
  {/* Preview button */}
  <Button variant="outline" onClick={playPreview}>
    <Play /> Preview
  </Button>
  
  {/* Download main sample */}
  <Button onClick={() => downloadSample(sample.id, false)}>
    <Download /> Download ({sample.credit_cost} credits)
  </Button>
  
  {/* Download stems (if available) */}
  {sample.has_stems && (
    <Button 
      variant="secondary"
      onClick={() => downloadStems(sample.id)}
    >
      <Music /> Download Stems (+{STEMS_BUNDLE_COST} credits)
    </Button>
  )}
  
  {/* Total cost indicator */}
  {sample.has_stems && (
    <p className="text-xs text-muted-foreground">
      Total with stems: {sample.credit_cost + STEMS_BUNDLE_COST} credits
    </p>
  )}
</SampleCard>
```

### Sample Detail Page
```tsx
<SampleDetailPage>
  {/* Main sample section */}
  <Section>
    <h2>Main Sample</h2>
    <AudioPlayer src={sample.audio_url} />
    <Button onClick={downloadMain}>
      Download Main ({sample.credit_cost} credits)
    </Button>
  </Section>
  
  {/* Stems section (conditional) */}
  {sample.has_stems && (
    <Section>
      <h2>Stems Bundle ({stems.length} files)</h2>
      
      {/* List individual stems */}
      {stems.map(stem => (
        <div key={stem.id}>
          <AudioPlayer src={stem.audio_url} />
          <span>{stem.name}</span>
        </div>
      ))}
      
      {/* Download all stems */}
      <Button onClick={downloadAllStems}>
        Download All Stems ({STEMS_BUNDLE_COST} credits)
      </Button>
      
      {/* Total cost */}
      <Alert>
        <p>Download main + stems: {totalCost} credits total</p>
      </Alert>
    </Section>
  )}
</SampleDetailPage>
```

## Purchase Flow

### Scenario: User Wants Sample + Stems

1. **Browse pack** → See samples list
2. **Click sample** → Open sample detail
3. **Preview main sample** → Play audio
4. **See stems available** → "Download Stems" button visible
5. **Preview stems** → Play individual stem tracks
6. **Add to cart** → Two options:
   - Main only (3 credits)
   - Main + stems (8 credits)
7. **Checkout** → Deduct credits
8. **Download** → ZIP file with main + all stems

### Scenario: User Wants Main Sample Only

1. **Browse pack** → See samples list
2. **Click download** → Download main sample (3 credits)
3. **Stems remain available** → Can purchase later for +5 credits

## Download Types

### Option 1: Main Sample Only
```
File: trap-beat-loop.wav
Cost: 3 credits
Size: ~10 MB
```

### Option 2: Stems Bundle Only (Not Recommended)
```
⚠️ Users should NOT be able to download stems without main sample
Reason: Stems are complementary to the main mix
```

### Option 3: Main + Stems Bundle (Recommended)
```
File: trap-beat-loop-bundle.zip
  ├── trap-beat-loop.wav (main mix)
  ├── drums.wav
  ├── bass.wav
  ├── melody.wav
  └── vocals.wav
Cost: 8 credits (3 + 5)
Size: ~50 MB
```

## Technical Implementation

### Upload Stems (Admin)
```typescript
// From audio-upload.ts
const stemResults = await uploadMultipleAudioFiles(stemFiles, "stems");

const stems = stemResults.map((result, i) => ({
  name: stemFiles[i].name,
  audio_url: result.url!,
  file_size_bytes: stemFiles[i].size,
}));

// Create sample with stems
await supabase.from("samples").insert({
  name: "Trap Beat Loop",
  type: "Loop",
  has_stems: true,
  ...
});

await supabase.from("stems").insert(
  stems.map(stem => ({
    sample_id: sampleId,
    name: stem.name,
    audio_url: stem.audio_url,
    file_size_bytes: stem.file_size_bytes,
  }))
);
```

### Fetch Sample with Stems (Frontend)
```typescript
const { data: sample } = await supabase
  .from("samples")
  .select(`
    *,
    stems (*)
  `)
  .eq("id", sampleId)
  .single();

// sample.stems = array of stem files
// sample.has_stems = boolean
```

### Download Stems as ZIP (Frontend)
```typescript
async function downloadStemsBundle(sampleId: string) {
  // 1. Fetch all stems for the sample
  const { data: stems } = await supabase
    .from("stems")
    .select("*")
    .eq("sample_id", sampleId);

  // 2. Download each stem file
  const stemBlobs = await Promise.all(
    stems.map(stem => fetch(stem.audio_url).then(r => r.blob()))
  );

  // 3. Create ZIP
  const zip = new JSZip();
  stemBlobs.forEach((blob, i) => {
    zip.file(stems[i].name, blob);
  });

  // 4. Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sample.name}-stems.zip`;
  a.click();

  // 5. Deduct credits
  await deductCredits(userId, STEMS_BUNDLE_COST);
}
```

## Validation Rules

### Admin Validation
1. **If has_stems = true** → Must upload at least 1 stem file
2. **Stem file formats** → WAV or MP3 only
3. **Stem file size** → Max 100MB per file (configurable)
4. **Sample type** → Can be Loop or One-shot only

### User Validation
1. **Sufficient credits** → User must have enough credits
2. **Published pack** → Sample must be in published pack
3. **Active sample** → Sample status must be Active
4. **Active stems** → Stems must exist in database

## Business Logic

### When to Offer Stems?
- **Loops** → Usually have stems (drum, bass, melody, etc.)
- **Compositions** → Usually have stems (multiple instruments)
- **One-shots** → Rarely have stems (single hit)

### Stems vs. Multi-Sample Packs
```
❌ Wrong: Separate samples for each instrument
Pack: Trap Drums
  - Sample 1: Kick
  - Sample 2: Snare
  - Sample 3: Hi-hat

✅ Correct: One sample with stems
Pack: Trap Drums
  - Sample: Drum Loop
    └── Stems: kick.wav, snare.wav, hihat.wav
```

## Pricing Strategy

### Standard Pack
```
One-shot:        2 credits
Loop:            3 credits
Stems (addon):  +5 credits
```

### Premium Pack
```
One-shot:        8 credits (4x)
Loop:           10 credits (~3.3x)
Stems (addon):  +5 credits (same for all)
```

**Note:** Stems cost is constant (+5) regardless of premium status.

## Security & RLS

### Stems Table Policies
```sql
-- Users can view stems for active samples in published packs
CREATE POLICY "Anyone can view stems for published samples" ON stems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM samples s 
      JOIN packs p ON s.pack_id = p.id 
      WHERE s.id = sample_id 
        AND s.status = 'Active' 
        AND p.status = 'Published'
    )
  );

-- Admins can manage all stems
CREATE POLICY "Admins can manage stems" ON stems
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
```

### Visibility Rules
```
Stems visible to users ONLY if:
  - Sample.status = 'Active' AND
  - Pack.status = 'Published' AND
  - Stems exist in stems table
```

## Testing Checklist

### Admin Panel
- [x] Upload sample with stems toggle
- [x] Upload multiple stem files
- [x] See stem file names in upload form
- [x] See stems count in Quality Check
- [x] Save pack with stems to database
- [ ] Edit sample to add/remove stems later

### Frontend App (TODO)
- [ ] Browse samples, see "Download Stems" for applicable samples
- [ ] Download main sample only
- [ ] Download stems bundle (all files)
- [ ] Download main + stems together
- [ ] Preview individual stem tracks
- [ ] Verify correct credit deduction

### Database
- [x] Stems table created
- [x] RLS policies working
- [x] Cascade delete works (delete sample → stems deleted)
- [x] Can query stems by sample_id

## Related Files

- `supabase/migrations/20260205000004_create_packs_and_samples_system.sql` - Database schema
- `src/pages/admin/library/CreatePack.tsx` - Admin upload interface
- `src/lib/audio-upload.ts` - Upload functions
- `src/config/credits.ts` - Credit cost configuration
- `STEMS_LOGIC_IMPLEMENTATION.md` - This file

## Summary

### ✅ Correctly Implemented
1. Database schema with stems table
2. Admin can upload stems per sample
3. Stems stored separately from parent sample
4. Credit cost configuration includes stems
5. RLS policies protect stems access

### 🔄 Needs Frontend Implementation
1. "Download Stems" button on sample cards
2. Stems preview functionality
3. ZIP bundle download
4. Credit deduction for stems
5. Stems count display in UI

### 📊 Key Metrics to Track
- % of samples with stems
- Average stems per sample
- Stems download rate vs main sample
- Revenue from stems (credits spent)

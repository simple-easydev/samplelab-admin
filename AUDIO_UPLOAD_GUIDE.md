# Audio Upload System Guide

This guide explains how to use the Supabase audio upload system for the SampleLab admin panel.

## Overview

The audio upload system provides:
- **Storage buckets** for audio files and pack covers
- **Database tables** for packs, samples, stems, creators, genres, categories
- **Helper functions** for uploading and managing files
- **RLS policies** for security

## Architecture

### Pack-First Design
- Every sample **must** belong to a pack
- Even single samples are treated as packs with 1 sample
- This ensures consistency and scalability

### Storage Structure

```
audio-samples/          # Bucket for all audio files
├── samples/           # Main sample files
│   └── {timestamp}-{random}.wav
└── stems/             # Stem files
    └── {timestamp}-{random}.wav

pack-covers/           # Bucket for pack artwork
└── covers/
    └── {timestamp}-{random}.jpg
```

## Database Schema

### Tables Created

1. **creators** - Artist/producer information
2. **genres** - Music genres (Trap, Lo-Fi, etc.)
3. **categories** - Sample categories (One-shot, Loops, Drums, Vocals)
4. **moods** - Mood tags (Energetic, Dark, Chill, etc.)
5. **packs** - Sample pack metadata
6. **pack_genres** - Many-to-many relationship (pack ↔ genres)
7. **samples** - Individual audio samples (belongs to pack)
8. **stems** - Stem files for samples (optional, multiple per sample)

### Pack Status Logic

- **Draft** - Only visible to admins, can be edited
- **Published** - Live on the site, visible to users
- **Disabled** - Hidden from users, kept in admin for reference

### Sample Status Logic

- **Active** - Can be shown if pack is Published
- **Disabled** - Hidden even if pack is Published

**Visibility Rule:**
```
Sample is visible to users ONLY if:
  - Sample status = "Active" AND
  - Pack status = "Published"
```

## Setup & Migration

### 1. Run the Migration

```bash
cd d:\work\SampleLab\admin
npx supabase db push
```

This will:
- Create storage buckets
- Create all necessary tables
- Set up RLS policies
- Seed initial genres, categories, and moods

### 2. Verify Storage Buckets

In Supabase Dashboard:
1. Go to **Storage**
2. You should see:
   - `audio-samples` (public)
   - `pack-covers` (public)

## Usage in Code

### Import the Upload Functions

```typescript
import {
  uploadAudioFile,
  uploadPackCover,
  uploadMultipleAudioFiles,
  createPackWithSamples,
  getCreators,
  getGenres,
  getCategories,
} from "@/lib/audio-upload";
```

### Upload a Single Audio File

```typescript
const result = await uploadAudioFile(audioFile, "samples");

if (result.success) {
  console.log("Uploaded to:", result.url);
  console.log("Storage path:", result.path);
} else {
  console.error("Upload failed:", result.error);
}
```

### Upload Pack Cover Image

```typescript
const result = await uploadPackCover(imageFile);

if (result.success) {
  console.log("Cover uploaded:", result.url);
}
```

### Upload Multiple Stem Files

```typescript
const stemFiles = [file1, file2, file3];
const results = await uploadMultipleAudioFiles(stemFiles, "stems");

// Check results
results.forEach((result, index) => {
  if (result.success) {
    console.log(`Stem ${index + 1} uploaded:`, result.url);
  } else {
    console.error(`Stem ${index + 1} failed:`, result.error);
  }
});
```

### Create a Complete Pack with Samples

```typescript
// 1. Upload cover image
const coverResult = await uploadPackCover(coverFile);

// 2. Upload audio files
const sampleUploads = await Promise.all(
  sampleFiles.map(file => uploadAudioFile(file, "samples"))
);

// 3. Prepare pack data
const packData = {
  name: "Trap Essentials Vol.1",
  description: "Hard-hitting trap samples",
  creator_id: "uuid-of-creator",
  cover_url: coverResult.url,
  category_id: "uuid-of-category",
  tags: ["808", "Trap", "Bass"],
  is_premium: false,
  status: "Draft" as const,
  genres: ["uuid-genre-1", "uuid-genre-2"],
};

// 4. Prepare samples data
const samples = sampleUploads.map((upload, index) => ({
  name: sampleFiles[index].name,
  audio_url: upload.url!,
  bpm: 140,
  key: "Am",
  type: "Loop" as const,
  length: "2:30",
  file_size_bytes: sampleFiles[index].size,
  credit_cost: 1,
  has_stems: false,
  stems: [],
}));

// 5. Create pack
const result = await createPackWithSamples(packData, samples);

if (result.success) {
  console.log("Pack created with ID:", result.packId);
} else {
  console.error("Pack creation failed:", result.error);
}
```

### Get Reference Data for Dropdowns

```typescript
// Load creators for dropdown
const creators = await getCreators();
// Returns: [{ id: "uuid", name: "Producer Mike" }, ...]

// Load genres for multi-select
const genres = await getGenres();
// Returns: [{ id: "uuid", name: "Trap" }, ...]

// Load categories
const categories = await getCategories();
// Returns: [{ id: "uuid", name: "Loops" }, ...]
```

## Integration with CreatePack Page

Here's how to integrate these functions into the `CreatePack` page:

```typescript
// In CreatePack.tsx
import {
  uploadAudioFile,
  uploadPackCover,
  uploadMultipleAudioFiles,
  createPackWithSamples,
} from "@/lib/audio-upload";

const handlePublish = async () => {
  setIsSubmitting(true);

  try {
    // 1. Upload cover if provided
    let coverUrl = "";
    if (coverPreview && coverFile) {
      const coverResult = await uploadPackCover(coverFile);
      if (coverResult.success) {
        coverUrl = coverResult.url!;
      }
    }

    // 2. Upload all sample files
    const sampleUploadResults = await Promise.all(
      sampleFiles.map(sample => uploadAudioFile(sample.file, "samples"))
    );

    // 3. For samples with stems, upload stems
    const samplesWithStems = sampleFiles.filter(s => s.hasStems);
    const stemUploads = await Promise.all(
      samplesWithStems.map(sample =>
        uploadMultipleAudioFiles(sample.stemFiles, "stems")
      )
    );

    // 4. Build samples array with uploaded URLs
    const samplesData = sampleFiles.map((sample, index) => {
      const uploadResult = sampleUploadResults[index];
      
      let stems = [];
      if (sample.hasStems) {
        const stemIndex = samplesWithStems.indexOf(sample);
        stems = stemUploads[stemIndex].map((result, i) => ({
          name: sample.stemFiles[i].name,
          audio_url: result.url!,
          file_size_bytes: sample.stemFiles[i].size,
        }));
      }

      return {
        name: sample.name,
        audio_url: uploadResult.url!,
        bpm: sample.bpm ? parseInt(sample.bpm) : undefined,
        key: sample.key || undefined,
        type: sample.type,
        length: sample.length || undefined,
        file_size_bytes: sample.file.size,
        credit_cost: sample.creditCost ? parseInt(sample.creditCost) : undefined,
        has_stems: sample.hasStems,
        stems,
      };
    });

    // 5. Create the pack
    const result = await createPackWithSamples(
      {
        name: formData.name,
        description: formData.description,
        creator_id: formData.creator, // You'll need actual UUID
        cover_url: coverUrl,
        category_id: formData.category, // You'll need actual UUID
        tags: formData.tags,
        is_premium: formData.isPremium,
        status: "Published",
        genres: formData.genres, // Array of UUIDs
      },
      samplesData
    );

    if (result.success) {
      alert(`Pack "${formData.name}" published successfully!`);
      navigate("/admin/library?tab=packs");
    } else {
      alert(`Failed to publish pack: ${result.error}`);
    }
  } catch (error) {
    console.error("Error publishing pack:", error);
    alert("An unexpected error occurred");
  } finally {
    setIsSubmitting(false);
  }
};
```

## Security & Permissions

### RLS Policies

All tables have Row Level Security enabled:

**Users (Public):**
- Can view Published packs only
- Can view Active samples in Published packs only
- Can download files from public storage

**Admins:**
- Can view/manage all packs (Draft, Published, Disabled)
- Can view/manage all samples (Active, Disabled)
- Can upload/delete files in storage

### Storage Policies

- Anyone can **read** from both buckets (public access for playback)
- Only **admins** can upload/delete files

## Helper Functions Available

### Database Functions
- `get_pack_sample_count(pack_uuid)` - Returns number of samples in a pack
- `increment_pack_downloads(pack_uuid)` - Increments pack download count
- `increment_sample_downloads(sample_uuid)` - Increments sample download count

### Usage Example

```sql
-- Get sample count for a pack
SELECT get_pack_sample_count('pack-uuid-here');

-- Increment download count
SELECT increment_pack_downloads('pack-uuid-here');
```

## Error Handling

All upload functions return standardized results:

```typescript
interface AudioUploadResult {
  success: boolean;
  url?: string;      // Public URL if successful
  path?: string;     // Storage path if successful
  error?: string;    // Error message if failed
}
```

Always check `success` before accessing `url` or `path`:

```typescript
const result = await uploadAudioFile(file);

if (result.success) {
  // Use result.url
} else {
  // Handle result.error
}
```

## Validation

### Audio Files
- **Allowed formats:** WAV, MP3
- **MIME types:** `audio/wav`, `audio/mpeg`, `audio/mp3`, `audio/x-wav`

### Cover Images
- **Allowed formats:** JPG, PNG, WebP
- **Max size:** 10MB
- **MIME types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

## Testing

### Test Upload Functionality

```typescript
// Test single file upload
const testFile = new File(["test"], "test.mp3", { type: "audio/mpeg" });
const result = await uploadAudioFile(testFile, "samples");
console.log("Upload test:", result);

// Test invalid file type
const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });
const invalidResult = await uploadAudioFile(invalidFile, "samples");
console.log("Should fail:", invalidResult);
```

## Next Steps

1. **Run migration:** `npx supabase db push`
2. **Verify buckets** in Supabase Dashboard
3. **Update CreatePack page** to use upload functions
4. **Add loading states** for upload progress
5. **Test with real audio files**

## Troubleshooting

### Upload fails with "Invalid bucket"
- Verify buckets exist in Supabase Dashboard → Storage
- Check bucket names match exactly: `audio-samples`, `pack-covers`

### Upload fails with "Permission denied"
- Verify user is authenticated as admin
- Check RLS policies are created correctly

### Files upload but URLs don't work
- Verify buckets are set to **public**
- Check CORS settings in Supabase if needed

## Support

For issues or questions, refer to:
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

# Edit Pack Page Implementation

## Overview

The Edit Pack page provides comprehensive editing capabilities for existing packs, including metadata updates, sample management, creator reassignment, and status changes. This page allows admins to modify all aspects of a pack after creation.

**Location**: `src/pages/admin/library/EditPack.tsx`  
**Route**: `/admin/library/packs/:id/edit`

---

## ✅ Features Implemented (All Requirements Met)

### 1. **Pack Metadata Editing** ✅
Edit all pack information:
- Pack name
- Description (multi-line textarea)
- Genres (multi-select dropdown)
- Category (single select)
- Tags (moods & style) - add/remove
- Cover image (upload new or keep existing)
- Premium pack toggle

### 2. **Creator Assignment** ✅
- Change the creator assigned to this pack
- Dropdown with all available creators
- Updates `creator_id` field

### 3. **Credit Cost Override (Optional)** ✅
- Individual samples can have custom credit costs
- Override field per sample (optional)
- Auto-calculate if not provided

### 4. **Add or Remove Samples** ✅
**Add New Samples:**
- Upload multiple audio files (WAV/MP3)
- Set metadata for each new sample
- Upload stems for new samples

**Remove Existing Samples:**
- Mark existing samples for deletion
- Visual confirmation (red badge)
- Undo option before saving
- Soft delete (only removed on save)

### 5. **Edit Sample Metadata** ✅
For each existing sample, edit:
- Sample name
- BPM
- Key (musical key)
- Type (Loop/One-shot)
- Credit cost override
- Stems (view if exists, note: replacing stems requires deleting and re-uploading)

### 6. **Change Status** ✅
Three status options:
- **Draft** → **Published** (via "Save & Publish")
- **Published** → **Draft** (via "Save as Draft")
- Keep current status (via "Save Changes")

### 7. **Multiple Save Actions** ✅
Three save modes based on current status:

**Always Available:**
- **"Save Changes"** - Updates pack, keeps current status

**If Currently Draft:**
- **"Save & Publish"** - Updates pack and sets status to Published

**If Currently Published:**
- **"Save as Draft"** - Updates pack and sets status to Draft

---

## UI Structure

### Page Layout

```
┌─────────────────────────────────────────────┐
│ [←] Edit Pack                     [Draft]   │
│     Editing: Pack Name                      │
├─────────────────────────────────────────────┤
│                                             │
│ 📦 Pack Metadata                            │
│   - Name, description                       │
│   - Genre, category, tags                   │
│   - Cover image                             │
│   - Premium toggle                          │
│                                             │
│ 👤 Creator Assignment                       │
│   - Select creator dropdown                 │
│                                             │
│ 🎵 Existing Samples                         │
│   [Sample 1] [Edit metadata] [Delete]      │
│   [Sample 2] [Edit metadata] [Delete]      │
│                                             │
│ ➕ Add New Samples                          │
│   [Upload audio files...]                   │
│   [New Sample 1] [Edit metadata]           │
│                                             │
│ 📊 Pack Summary                             │
│   Status: Draft | Total: 5 | Premium: Yes  │
│                                             │
│ 💾 Save Changes                             │
│   [Save Changes (Keep status)]             │
│   [Save & Publish] (if Draft)              │
│   [Save as Draft] (if Published)           │
│   [Cancel]                                  │
└─────────────────────────────────────────────┘
```

---

## Data Flow

### 1. **Load Existing Pack Data**

```typescript
// Fetch pack metadata
supabase.from("packs").select(`
  id, name, description, creator_id, cover_url,
  category_id, tags, is_premium, status,
  creators (name),
  categories (name)
`)

// Fetch pack genres (many-to-many)
supabase.from("pack_genres").select(`
  genre_id,
  genres (name)
`)

// Fetch existing samples
supabase.from("samples").select("*").eq("pack_id", id)
```

### 2. **Track Changes**

```typescript
// Metadata changes
formData state → tracks all pack metadata changes

// Existing samples
existingSamples → array with `isModified` flag
samplesToDelete → array of sample IDs to delete

// New samples
newSampleFiles → array of new files to upload
```

### 3. **Save Process**

```typescript
performSave(newStatus?)
  1. Upload new cover (if changed)
  2. Update pack metadata
  3. Update pack genres (delete + re-insert)
  4. Delete marked samples
  5. Update modified existing samples
  6. Upload and insert new samples
  7. Navigate to pack detail page
```

---

## Sample Management

### Existing Samples

**View Mode:**
- Display sample name, type, BPM, key
- Play button to preview audio
- Shows "Has stems" badge if applicable

**Edit Mode:**
- Inline editing of name, BPM, key, type
- Mark for deletion (soft delete)
- Undo deletion before saving
- Modified samples get `isModified` flag

**Delete Process:**
1. Click "Delete" button
2. Sample marked with red badge
3. "Undo" button appears
4. On save, sample is deleted from database

### New Samples

**Upload Process:**
1. Select multiple audio files
2. Auto-populate sample name from filename
3. Edit metadata (name, BPM, key, type, credit cost)
4. Optionally add stems:
   - Check "Has stems?" checkbox
   - Upload multiple stem files
   - View stem count
   - Remove stems before save

**Metadata Per Sample:**
- Name (auto-filled, editable)
- BPM (optional)
- Key (optional)
- Type (Loop/One-shot)
- Credit cost (optional override)
- Stems (optional, 0-N files)

---

## Status Change Logic

### Current Status: Draft

**Available Actions:**
1. **Save Changes** → Stays Draft
2. **Save & Publish** → Becomes Published

**Confirmation Dialog:**
- Shown when clicking "Save & Publish"
- Warns that pack will become visible to users
- User can cancel or confirm

### Current Status: Published

**Available Actions:**
1. **Save Changes** → Stays Published
2. **Save as Draft** → Becomes Draft

**Confirmation Dialog:**
- Shown when clicking "Save as Draft"
- Warns that pack will be hidden from users
- User can cancel or confirm

### Current Status: Disabled

**Available Actions:**
1. **Save Changes** → Stays Disabled

**Note:** To re-enable, go to Pack Detail page and use "Enable Pack" action

---

## Validation

### Required Fields
- ✅ Pack name (must not be empty)
- ✅ Creator (must be selected)
- ✅ Category (must be selected)
- ✅ Genres (at least one must be selected)

### Optional Fields
- Description
- Tags
- Cover image
- Premium toggle
- Sample metadata (BPM, Key, Credit cost)

### Validation Errors
- Show alert dialog with specific error message
- Prevent save until all required fields are filled

---

## Upload Progress

### Progress Tracking

Shows real-time progress during save:

```
Step 1: Preparing (0%)
Step 2: Uploading cover (10%)
Step 3: Updating pack (20%)
Step 4: Updating genres (30%)
Step 5: Deleting samples (40%)
Step 6: Updating samples (50%)
Step 7: Uploading new samples (60-90%)
Step 8: Complete (100%)
```

### Progress UI
- Alert box at bottom of page
- Animated spinner
- Progress bar (visual percentage)
- Current step description
- Current action message

---

## Audio Preview

### Existing Samples
- Play button for each sample
- Uses existing `audio_url` from database
- Toggle play/pause
- Only one sample plays at a time
- Auto-stop previous when new one starts

### New Samples
- No preview (files not yet uploaded to storage)
- Preview available after pack is saved

---

## Cover Image Handling

### Existing Cover
- Shows current cover image (32x32 thumbnail)
- Can keep existing or replace

### New Cover
- Upload via file input
- Preview shown immediately (client-side)
- Uploaded to Supabase Storage on save
- Updates `cover_url` in database

### No Cover
- No image displayed
- Can add cover image

---

## Error Handling

### Load Errors
- Pack not found → Show error alert + "Back to Library" button
- Database error → Show error message

### Save Errors
- Upload failures → Show specific error message
- Validation errors → Show alert dialog
- Database errors → Log to console + show user-friendly message
- Progress stops at error step

### Network Errors
- Supabase connection issues handled gracefully
- Error messages displayed to user

---

## Navigation

### Entry Points
1. **Pack Detail Page** → "Edit Pack" button
2. **Packs Table** → "Edit Pack" action in dropdown

### Exit Points
1. **Save Success** → Navigate to Pack Detail (`/admin/library/packs/:id`)
2. **Cancel** → Navigate to Pack Detail
3. **Back Button** → Navigate to Pack Detail

---

## Route Configuration

**App.tsx:**
```tsx
<Route path="library/packs/:id/edit" element={<EditPack />} />
```

**Route Order (Important):**
```tsx
/admin/library/packs/new        → CreatePack
/admin/library/packs/:id/edit   → EditPack
/admin/library/packs/:id        → PackDetail
```

Order ensures `/edit` matches before generic `:id`

---

## Components Used

### shadcn/ui Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`, `Input`, `Label`, `Badge`, `Separator`
- `Alert`, `AlertDescription`, `Textarea`
- `DropdownMenu` (with multi-select support)
- `AlertDialog` (for confirmations)

### Icons (Lucide React)
```typescript
ArrowLeft, Package, Upload, X, Play, Pause,
Trash2, FileAudio, Loader2, AlertCircle,
Save, Check
```

---

## State Management

### Component State

```typescript
// Loading states
isLoadingPack: boolean          // Initial pack load
isLoadingData: boolean          // Reference data load
packNotFound: boolean           // Pack not found error
isSubmitting: boolean           // Save in progress

// Form data
formData: {
  name, description, creator,
  genres[], category, tags[],
  coverUrl, isPremium, status
}

// Files
coverFile: File | null          // New cover image
coverPreview: string | null     // Cover preview URL

// Samples
existingSamples: ExistingSample[]  // From database
samplesToDelete: string[]          // IDs to delete
newSampleFiles: NewSampleFile[]    // New uploads

// UI state
tagInput: string                // Tag input field
playingSampleId: string | null  // Currently playing sample
audioRef: HTMLAudioElement      // Audio player reference

// Dialogs
showStatusChangeDialog: boolean
pendingSaveAction: "save" | "publish" | "draft" | null

// Progress
uploadProgress: {
  step, current, total,
  percentage, message
}
```

---

## API Operations

### Read Operations
1. **Get pack data** - `packs` table with joins
2. **Get pack genres** - `pack_genres` + `genres`  
3. **Get samples** - `samples` table
4. **Get creators** - Helper function
5. **Get genres** - Helper function
6. **Get categories** - Helper function

### Write Operations
1. **Update pack** - `packs.update()`
2. **Delete pack_genres** - `pack_genres.delete()`
3. **Insert pack_genres** - `pack_genres.insert()`
4. **Delete samples** - `samples.delete().in(ids)`
5. **Update samples** - `samples.update()` (modified)
6. **Insert samples** - `samples.insert()` (new)
7. **Insert stems** - `stems.insert()` (for new samples)
8. **Upload cover** - Supabase Storage
9. **Upload audio** - Supabase Storage
10. **Upload stems** - Supabase Storage

---

## Differences from CreatePack

| Feature | CreatePack | EditPack |
|---------|-----------|----------|
| Initial data | Empty form | Pre-filled from DB |
| Samples | All new uploads | Mix of existing + new |
| Delete samples | N/A | Mark for deletion |
| Edit samples | Inline (pre-save) | Inline (pre-save) |
| Status | Always starts Draft | Can be any status |
| Save actions | 2 (Draft/Publish) | 3 (Save/Publish/Draft) |
| Cover image | Upload only | Keep or replace |
| Validation | On submit | On submit |
| Loading state | Minimal | Fetch existing data |

---

## Testing Checklist

### Functionality
- [ ] Load existing pack data correctly
- [ ] Pre-fill all form fields
- [ ] Update pack metadata
- [ ] Change creator
- [ ] Add/remove genres
- [ ] Add/remove tags
- [ ] Upload new cover image
- [ ] Toggle premium status
- [ ] Edit existing sample metadata
- [ ] Mark existing samples for deletion
- [ ] Undo sample deletion
- [ ] Upload new samples
- [ ] Add stems to new samples
- [ ] Save with "Save Changes"
- [ ] Save with "Save & Publish" (Draft only)
- [ ] Save with "Save as Draft" (Published only)
- [ ] Status change confirmation dialogs
- [ ] Navigate back to pack detail after save
- [ ] Cancel returns to pack detail
- [ ] Audio preview for existing samples

### Edge Cases
- [ ] Pack with no samples
- [ ] Pack with 100+ samples
- [ ] Pack with no cover image
- [ ] Pack with no description
- [ ] Pack with no tags
- [ ] Pack with disabled status
- [ ] Delete all existing samples
- [ ] Add many new samples (20+)
- [ ] Upload very large audio files
- [ ] Network error during save
- [ ] Invalid pack ID

### Validation
- [ ] Required field: Pack name
- [ ] Required field: Creator
- [ ] Required field: Category
- [ ] Required field: At least one genre
- [ ] File type validation (WAV/MP3)
- [ ] Shows validation errors

---

## Future Enhancements

1. **Inline Stem Management**
   - View existing stems
   - Replace individual stem files
   - Add stems to existing samples

2. **Bulk Sample Operations**
   - Select multiple samples
   - Batch edit metadata
   - Bulk delete

3. **Change History**
   - Track who edited what and when
   - Show edit history
   - Revert to previous version

4. **Rich Text Editor**
   - Better description editing
   - Markdown support
   - Preview mode

5. **Cover Image Editor**
   - Crop/resize functionality
   - Filters and adjustments
   - Multiple image variants

6. **Sample Reordering**
   - Drag and drop to reorder
   - Set custom sort order
   - Preview order

7. **Auto-Save Draft**
   - Periodic auto-save
   - Prevent data loss
   - Recovery on page reload

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Load pack data | ✅ Complete | With joins and samples |
| Edit pack metadata | ✅ Complete | All fields editable |
| Creator assignment | ✅ Complete | Dropdown selector |
| Credit cost override | ✅ Complete | Per-sample override |
| Add samples | ✅ Complete | Multiple uploads |
| Remove samples | ✅ Complete | Mark for deletion + undo |
| Edit sample metadata | ✅ Complete | Inline editing |
| Add stems to new samples | ✅ Complete | Multiple file upload |
| View existing stems | ✅ Complete | Badge only |
| Replace existing stems | ⚠️ Partial | Requires delete + re-upload |
| Status change | ✅ Complete | Draft ↔ Published |
| Save actions | ✅ Complete | All 3 modes |
| Confirmation dialogs | ✅ Complete | Status changes |
| Upload progress | ✅ Complete | Real-time tracking |
| Audio preview | ✅ Complete | Existing samples only |
| Cover upload | ✅ Complete | Replace or keep |
| Validation | ✅ Complete | Required fields |
| Error handling | ✅ Complete | Graceful errors |

---

## Related Documentation

- `PACK_DETAIL_PAGE_IMPLEMENTATION.md` - Pack viewing
- `CREATEPACK_INTEGRATION_COMPLETE.md` - Pack creation
- `AUDIO_UPLOAD_GUIDE.md` - Audio file handling
- `STEMS_LOGIC_IMPLEMENTATION.md` - Stems architecture
- `PREMIUM_PACKS_IMPLEMENTATION.md` - Premium pricing

---

**Created**: February 5, 2026  
**Status**: ✅ **Complete**  
**Version**: 1.0

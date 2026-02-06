# Soft Delete & Download History Protection

## Overview

**Critical Business Rule**: Editing or deleting samples from packs **MUST NOT** affect users who have already downloaded those samples. This ensures user trust, legal compliance, and data integrity.

---

## Problem Statement

When admins edit packs and remove samples:
- ❌ **Hard Delete**: Removes sample from database → breaks download history
- ❌ **User Access**: Previously downloaded samples become inaccessible
- ❌ **Statistics**: Download counts and history are lost
- ❌ **Legal Issues**: Users paid credits, must retain access

---

## Solution: Soft Delete

Instead of deleting samples from the database, we **change their status** to `"Deleted"`.

### Sample Status States

| Status | Visibility | In Pack? | User Access | Download History |
|--------|-----------|----------|-------------|------------------|
| **Active** | ✅ Public | ✅ Yes | ✅ Can download | ✅ Preserved |
| **Disabled** | ❌ Hidden | ✅ Yes | ❌ Cannot download | ✅ Preserved |
| **Deleted** | ❌ Hidden | ❌ No | ✅ Previously downloaded | ✅ Preserved |

---

## Implementation

### Database Schema

**Migration**: `20260205000005_add_deleted_status_to_samples.sql`

```sql
-- Samples status CHECK constraint
ALTER TABLE samples 
  ADD CONSTRAINT samples_status_check 
  CHECK (status IN ('Active', 'Disabled', 'Deleted'));
```

### Edit Pack Behavior

**File**: `src/pages/admin/library/EditPack.tsx`

```typescript
// Soft delete: Change status instead of removing record
await supabase
  .from("samples")
  .update({ 
    status: "Deleted",
    updated_at: new Date().toISOString()
  })
  .in("id", samplesToDelete);
```

**NOT** hard delete:
```typescript
// ❌ WRONG - Do not use this!
await supabase.from("samples").delete().in("id", samplesToDelete);
```

### Loading Samples (Edit Pack)

```typescript
// Exclude Deleted samples from edit interface
const { data: samplesData } = await supabase
  .from("samples")
  .select("*")
  .eq("pack_id", id)
  .neq("status", "Deleted") // Exclude soft-deleted samples
  .order("created_at", { ascending: true });
```

### Public Visibility (RLS Policy)

```sql
-- Only Active samples in Published packs are visible to users
CREATE POLICY "Anyone can view active samples in published packs" ON samples
  FOR SELECT USING (
    status = 'Active' AND 
    EXISTS (SELECT 1 FROM packs WHERE id = pack_id AND status = 'Published')
  );
```

---

## User Flow Examples

### Example 1: Admin Removes Sample from Pack

**Scenario**: Admin removes "808 Bass Hit" from "Trap Pack Vol.1"

1. **Before Deletion**:
   - Sample status: `Active`
   - Visible in pack: ✅ Yes
   - Users can download: ✅ Yes
   - Download count: 150 users

2. **Admin Action**: Marks sample for deletion in Edit Pack page

3. **After Deletion**:
   - Sample status: `Deleted`
   - Visible in pack: ❌ No (hidden from pack listing)
   - Users can download: ❌ No (new users cannot download)
   - **150 users who already downloaded: ✅ Still have access**
   - Download count: Still shows 150 (preserved)

### Example 2: User Accesses Previously Downloaded Sample

**Scenario**: User downloaded "808 Bass Hit" last week, admin removes it today

1. **User's Library**:
   - Sample still appears in "My Downloads"
   - Audio file still plays
   - Can re-download from their library
   - Credit purchase history intact

2. **User's Perspective**:
   - No disruption to their workflow
   - No notification needed
   - Content they paid for is still accessible

---

## Sample Count Behavior

### Pack Detail Page

```typescript
// Only count Active and Disabled samples (exclude Deleted)
const { data: samplesData } = await supabase
  .from("samples")
  .select("id, type, has_stems, audio_url")
  .eq("pack_id", id)
  .in("status", ["Active", "Disabled"]); // Exclude Deleted

const samples_count = samplesData?.length || 0;
```

### Packs Table

```typescript
// Count only Active samples for public display
const { data: samplesCount } = await supabase
  .from("samples")
  .select("pack_id, id")
  .eq("status", "Active"); // Only active samples count
```

---

## Download History Architecture

### User Downloads Table (Future)

When implementing user download tracking:

```sql
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES samples(id) ON DELETE RESTRICT, -- RESTRICT prevents deletion
  pack_id UUID REFERENCES packs(id) ON DELETE RESTRICT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits_spent INTEGER NOT NULL
);
```

**Key Points**:
- `ON DELETE RESTRICT` prevents deletion of samples/packs with download history
- Even if sample is soft-deleted (`status = 'Deleted'`), record remains
- Users can always access samples they've downloaded

---

## Admin Interface Behavior

### Edit Pack Page

**Visible Samples**:
- ✅ Active samples
- ✅ Disabled samples
- ❌ Deleted samples (don't show in edit interface)

**"Delete" Button**:
- Label: "Delete" or "Remove from Pack"
- Action: Sets `status = 'Deleted'`
- Visual: Red badge "Marked for deletion"
- Undo: Available before save (revert status)

### Pack Detail Page

**Sample Count**:
- Shows: Active + Disabled samples
- Excludes: Deleted samples

**Analytics**:
- Download count: Includes all downloads (even from deleted samples)
- Shows historical data accurately

---

## Business Rules

### 1. **Preserve Purchase History**
- Users paid credits for content
- Must retain access indefinitely
- Cannot revoke access after purchase

### 2. **Accurate Analytics**
- Download counts reflect historical reality
- Don't hide or delete past statistics
- Admins can see true pack performance

### 3. **Clean Pack Management**
- Admins can remove unwanted samples from packs
- Pack listings only show relevant, current samples
- Deleted samples don't clutter the interface

### 4. **Data Integrity**
- Foreign key relationships preserved
- No orphaned download records
- Database consistency maintained

---

## Migration from Hard Delete

If hard deletes were previously used:

### Step 1: Add Status Column (if missing)
```sql
ALTER TABLE samples ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
```

### Step 2: Update Existing Records
```sql
-- All existing samples are Active by default
UPDATE samples SET status = 'Active' WHERE status IS NULL;
```

### Step 3: Add Constraint
```sql
ALTER TABLE samples ADD CONSTRAINT samples_status_check 
  CHECK (status IN ('Active', 'Disabled', 'Deleted'));
```

### Step 4: Update Application Code
- Replace all `.delete()` with `.update({ status: 'Deleted' })`
- Add `.neq("status", "Deleted")` to sample queries
- Update RLS policies

---

## Testing Checklist

### Soft Delete Testing
- [ ] Admin removes sample from pack
- [ ] Sample status changes to "Deleted"
- [ ] Sample no longer appears in pack listing
- [ ] Sample count decreases
- [ ] New users cannot download sample
- [ ] Sample record remains in database
- [ ] Download count preserved

### User Access Testing
- [ ] User downloads sample before deletion
- [ ] Admin deletes sample
- [ ] User can still access sample from library
- [ ] User can re-download from their history
- [ ] User's credit history shows purchase
- [ ] No error messages for user

### Admin Interface Testing
- [ ] Edit Pack: Deleted samples don't show
- [ ] Pack Detail: Sample count excludes deleted
- [ ] Analytics: Download counts include deleted samples
- [ ] Cannot "delete" already-deleted samples

### Database Testing
- [ ] Soft delete updates status
- [ ] Foreign key constraints intact
- [ ] RLS policies work correctly
- [ ] Queries exclude deleted samples where appropriate

---

## Future Enhancements

### 1. **Admin View of Deleted Samples**
- Add "Show Deleted" toggle in Edit Pack
- Display deleted samples with "Deleted" badge
- Allow "Restore" action (change status back to Active)

### 2. **Automatic Cleanup**
- After 90 days, if no downloads, allow hard delete
- Notification before permanent deletion
- Preserve samples with download history indefinitely

### 3. **Audit Log**
- Track who deleted sample and when
- Show deletion history in admin panel
- Allow reverting accidental deletions

### 4. **User Library**
- Separate "Available" vs "Archived" sections
- Mark samples as archived if deleted from pack
- Show notification: "Sample removed from pack but still available to you"

---

## Related Documentation

- `EDIT_PACK_PAGE_IMPLEMENTATION.md` - Edit pack functionality
- `PACK_FIRST_ARCHITECTURE.md` - Pack-first data model
- `PACKS_TABLE_DATABASE_INTEGRATION.md` - Database schema

---

## Key Takeaways

1. ✅ **Never hard delete samples** - Always use soft delete
2. ✅ **Protect user access** - Downloaded content remains accessible
3. ✅ **Preserve history** - Download counts and records stay intact
4. ✅ **Clean interface** - Deleted samples hidden from pack listings
5. ✅ **Admin flexibility** - Can remove samples without breaking user experience

---

**Status**: ✅ Implemented  
**Migration**: `20260205000005_add_deleted_status_to_samples.sql`  
**Last Updated**: February 5, 2026

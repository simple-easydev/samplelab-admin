# Pack Status and Sample Visibility Logic

## Overview

Pack status controls the visibility of **both the pack AND all samples inside it**. This provides centralized control over content visibility.

---

## Pack Status States

### 1. **Draft** (Work in Progress)
**Behavior:**
- ❌ Pack is hidden from users
- ❌ All samples in pack are hidden from users
- ✅ Visible only to admins
- ✅ Can be edited freely
- ✅ Can be published when ready

**Use Case:**
- Creating new packs
- Testing content before release
- Preparing updates

**Confirmation Dialog:**
```
Publish Pack?
This pack and all Active samples inside it will become visible to users.
They will appear in search results and be available for download.
```

---

### 2. **Published** (Live)
**Behavior:**
- ✅ Pack is visible to all users
- ✅ Active samples are visible and downloadable
- ❌ Disabled samples in pack remain hidden
- ❌ Deleted samples remain hidden
- ✅ Appears in search results
- ✅ Available for download

**Use Case:**
- Live content
- Available for purchase
- Earning revenue

**Note:** Only **Active** samples within Published packs are visible to users.

---

### 3. **Disabled** (Temporarily Hidden)
**Behavior:**
- ❌ Pack is hidden from users
- ❌ **ALL samples in pack are hidden** (regardless of sample status)
- ✅ Previously downloaded samples **remain accessible** in user accounts
- ✅ Can be re-enabled at any time
- ✅ All data preserved

**Use Case:**
- Temporarily removing content
- Updating pack content
- Quality issues
- Rights/licensing issues

**Confirmation Dialog:**
```
Disable Pack?
This pack and all samples inside it will be hidden from users. 
Previously downloaded items remain available in user accounts. 
You can re-enable this pack at any time.
```

---

## Sample Status States (Within Packs)

### 1. **Active**
- ✅ Visible if pack is Published
- ❌ Hidden if pack is Draft or Disabled
- ✅ Downloadable (when pack is Published)

### 2. **Disabled**
- ❌ Always hidden from users
- ❌ Not downloadable
- ✅ Remains in pack (admin can re-enable)
- ✅ Preserved in database

### 3. **Deleted** (Soft Delete)
- ❌ Removed from pack
- ❌ Not visible to users
- ✅ Previously downloaded items remain accessible
- ✅ Preserved for download history

---

## Visibility Matrix

| Pack Status | Sample Status | Visible to Users? | Downloadable? |
|-------------|---------------|-------------------|---------------|
| **Draft** | Active | ❌ No | ❌ No |
| **Draft** | Disabled | ❌ No | ❌ No |
| **Draft** | Deleted | ❌ No | ❌ No |
| **Published** | Active | ✅ **Yes** | ✅ **Yes** |
| **Published** | Disabled | ❌ No | ❌ No |
| **Published** | Deleted | ❌ No | ❌ No |
| **Disabled** | Active | ❌ No | ❌ No |
| **Disabled** | Disabled | ❌ No | ❌ No |
| **Disabled** | Deleted | ❌ No | ❌ No |

**Key Rule**: Users can only see and download samples that are **BOTH**:
1. Sample status = `Active`
2. Pack status = `Published`

---

## Database Implementation

### RLS Policy (Row Level Security)

```sql
-- Users can only see Active samples in Published packs
CREATE POLICY "Anyone can view active samples in published packs" ON samples
  FOR SELECT USING (
    status = 'Active' AND 
    EXISTS (SELECT 1 FROM packs WHERE id = pack_id AND status = 'Published')
  );
```

This policy ensures:
- ✅ Pack status is checked automatically
- ✅ Sample status is checked
- ✅ Both must be correct for visibility
- ✅ Applies to all user queries

---

## User Download History Protection

### Critical Rule
**Disabling a pack does NOT affect previously downloaded samples!**

### How It Works

1. **User Downloads Sample**
   - User spends credits
   - Download recorded in `user_downloads` table
   - Sample accessible in user's library

2. **Admin Disables Pack**
   - Pack status → `Disabled`
   - Pack hidden from public
   - All samples in pack hidden from new downloads

3. **User's Previously Downloaded Sample**
   - ✅ Still appears in user's library
   - ✅ Still playable
   - ✅ Can re-download from library
   - ✅ Credit purchase honored

### Implementation

```sql
-- User library query (pseudo-code)
SELECT samples.*
FROM user_downloads
JOIN samples ON samples.id = user_downloads.sample_id
WHERE user_downloads.user_id = current_user_id
-- Note: No pack status check! User keeps access regardless of pack status
```

---

## Admin Actions

### Disable Pack

**When to Use:**
- Temporarily remove content
- Fix quality issues
- Update pack content
- Handle licensing issues

**Process:**
1. Admin clicks "Disable Pack"
2. Confirmation dialog shows
3. Pack status → `Disabled`
4. All samples hidden automatically
5. Users keep previously downloaded samples

**Code:**
```typescript
await supabase
  .from("packs")
  .update({ status: "Disabled" })
  .eq("id", packId);
```

### Enable Pack (Re-publish)

**When to Use:**
- Content is ready again
- Issues resolved
- Updates complete

**Process:**
1. Admin clicks "Enable Pack"
2. Confirmation dialog shows
3. Pack status → `Published`
4. Active samples become visible
5. Users can download again

**Code:**
```typescript
await supabase
  .from("packs")
  .update({ status: "Published" })
  .eq("id", packId);
```

---

## Use Case Examples

### Example 1: Copyright Issue

**Scenario**: Admin discovers copyright issue in "Trap Pack Vol.1"

1. **Action**: Admin disables pack immediately
   - Click "Disable Pack" in Pack Detail page
   - Confirm action

2. **Result**:
   - ❌ Pack hidden from search
   - ❌ New users cannot download
   - ✅ 250 users who already downloaded keep access
   - ✅ No refunds needed
   - ✅ No user complaints

3. **Resolution**:
   - Replace problematic samples
   - Re-enable pack
   - Users see updated content

### Example 2: Seasonal Content

**Scenario**: "Christmas Sounds 2025" pack after holidays

1. **Action**: Admin disables pack on January 1st
   - Pack hidden from main catalog
   - Samples not available for new downloads

2. **User Experience**:
   - Users who bought it in December still have full access
   - Can use samples year-round
   - Content remains in their library

3. **Next Season**:
   - Admin updates samples
   - Re-enables pack in November
   - Available for new purchases

### Example 3: Quality Update

**Scenario**: Admin wants to improve sample quality

1. **Disable Pack**:
   - Hide from users during update
   - No new downloads during work

2. **Edit Pack**:
   - Upload improved samples
   - Delete old versions (soft delete)
   - Update metadata

3. **Re-enable Pack**:
   - Publish with improvements
   - Users see "Updated" content
   - Previous downloads unaffected

---

## Best Practices

### When to Disable vs Delete

**Disable Pack** (Recommended):
- ✅ Temporary removal
- ✅ Content issues
- ✅ Updates needed
- ✅ Reversible action
- ✅ Preserves everything

**Delete Pack** (Rare):
- ⚠️ Permanent removal
- ⚠️ Only if no downloads
- ⚠️ Cannot be undone
- ⚠️ Last resort only

### Communication

**Disable Pack**:
- ✅ No user notification needed
- ✅ Silent action
- ✅ Users keep downloads

**Delete Pack**:
- ⚠️ Warn users if possible
- ⚠️ Check download count first
- ⚠️ Only delete if 0 downloads

---

## Technical Implementation

### Pack Status Change

```typescript
// Disable pack
const { error } = await supabase
  .from("packs")
  .update({ 
    status: "Disabled",
    updated_at: new Date().toISOString()
  })
  .eq("id", packId);

// Enable pack
const { error } = await supabase
  .from("packs")
  .update({ 
    status: "Published",
    updated_at: new Date().toISOString()
  })
  .eq("id", packId);
```

### Sample Visibility Query

```typescript
// Get visible samples (for public)
const { data: samples } = await supabase
  .from("samples")
  .select("*")
  .eq("status", "Active")
  // Pack status check handled by RLS policy automatically
  
// Get all samples (for admin)
const { data: samples } = await supabase
  .from("samples")
  .select("*")
  .eq("pack_id", packId)
  // Admin sees all samples regardless of status
```

---

## Testing Checklist

### Pack Disable
- [ ] Pack hidden from search
- [ ] Pack hidden from listings
- [ ] All samples hidden (Active, Disabled, Deleted)
- [ ] Previously downloaded samples still accessible
- [ ] Download count preserved
- [ ] Can re-enable pack
- [ ] Admin can still view/edit

### Pack Enable
- [ ] Pack appears in search
- [ ] Pack appears in listings
- [ ] Active samples become visible
- [ ] Disabled samples stay hidden
- [ ] Deleted samples stay hidden
- [ ] Users can download Active samples

### User Access
- [ ] Downloaded samples before disable → still accessible
- [ ] Downloaded samples after re-enable → accessible
- [ ] Cannot download during disable period
- [ ] Can download after re-enable
- [ ] Credit history intact

---

## Related Documentation

- `SOFT_DELETE_AND_DOWNLOAD_HISTORY.md` - Sample soft delete
- `PACK_DETAIL_PAGE_IMPLEMENTATION.md` - Pack detail page
- `EDIT_PACK_PAGE_IMPLEMENTATION.md` - Pack editing

---

## Summary

**Pack Status is the master switch**:
- Published = Visible (Active samples only)
- Draft = Hidden (all samples)
- Disabled = Hidden (all samples, but user downloads preserved)

**Sample Status works within pack status**:
- Only matters when pack is Published
- Active + Published Pack = Visible ✅
- Everything else = Hidden ❌

**User downloads are sacred**:
- Always preserved
- Always accessible
- Never revoked
- Trust is paramount

---

**Last Updated**: February 5, 2026  
**Status**: ✅ Implemented and Documented

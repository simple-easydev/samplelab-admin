# Pack & Sample Status Logic

This document explains the status system for packs and samples in the SampleLab admin panel.

## Core Architecture: Pack-First

**Every sample MUST belong to a pack — no exceptions.**

Even single samples are packaged as "packs with 1 sample". This keeps the system consistent and scalable.

See [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) for full architecture details.

## Pack Status (3 States)

### 1. Draft 🟡
- **Visibility**: Not visible to users
- **User Access**: None - only admins can see
- **Purpose**: For packs being prepared, reviewed, or tested before launch
- **Downloads**: Always 0 (not live yet)
- **Badge Color**: Gray (secondary)
- **Action**: "Publish Pack" to make live

### 2. Published 🟢
- **Visibility**: Live on the site
- **User Access**: Users can see and download the pack
- **Badge Color**: Green/Blue (default)
- **Action**: "Disable Pack" to hide from users

### 3. Disabled 🔴
- **Visibility**: Removed from user view
- **User Access**: Users cannot see or download
- **Admin Access**: Still visible in admin panel for management
- **Badge Color**: Red (destructive)
- **Action**: "Re-publish Pack" to make live again

## Sample Status (2 States)

### 1. Active 🟢
- **Visibility**: Allowed to show in packs
- **Badge Color**: Green/Blue (default)

### 2. Disabled 🔴
- **Visibility**: Hidden, even if pack is Published
- **Badge Color**: Red (destructive)

## Status Workflow

```
Draft → Publish → Published
Published → Disable → Disabled
Disabled → Re-publish → Published
Draft → Delete (permanent removal)
```

## Sample Visibility Logic

A sample is visible to users **ONLY IF**:

```
Pack Status = Published  AND  Sample Status = Active
```

### Examples:

| Pack Status | Sample Status | Visible to Users? |
|-------------|---------------|-------------------|
| Draft       | Active        | ❌ NO             |
| Draft       | Disabled      | ❌ NO             |
| Published   | Active        | ✅ YES            |
| Published   | Disabled      | ❌ NO             |
| Disabled    | Active        | ❌ NO             |
| Disabled    | Disabled      | ❌ NO             |

## Admin Actions

### Pack Actions:
1. **View Pack** - Navigate to pack detail page
2. **Edit Pack** - Edit pack information
3. **Publish Pack** (if Draft) - Make live on site for first time
4. **Disable Pack** (if Published) - Hide from users but keep in system
5. **Re-publish Pack** (if Disabled) - Make live on site again
6. **Delete Pack** - Permanently delete (typically only for Draft packs)

### Sample Actions:
1. **View Pack** - Navigate to the pack this sample belongs to
2. **Edit Sample** - Edit sample information
3. **Play Preview** - Audio preview player
4. **Disable Sample** (if Active) - Hide from users
5. **Activate Sample** (if Disabled) - Allow in pack
6. **Delete Sample** - Permanently delete

## Use Cases

### Prepare a new pack before launch:
1. Create pack with status "Draft"
2. Upload and configure samples
3. Test and review content
4. When ready: "Publish Pack" to make live
5. Result: Pack becomes visible to users

### Hide a specific sample from a published pack:
1. Keep Pack as "Published"
2. Set Sample to "Disabled"
3. Result: Other samples in pack remain visible, but this one is hidden

### Take an entire pack offline:
1. Set Pack to "Disabled"
2. Result: All samples in the pack become invisible, regardless of their individual status

### Temporarily disable a pack for updates:
1. Set Pack to "Disabled"
2. Make changes to pack/samples
3. Click "Re-publish Pack"
4. Result: Pack and all Active samples are visible again

### Test new content without users seeing it:
1. Create as "Draft"
2. Admins can view and test in admin panel
3. Publish when ready

## Best Practices

1. **Before deleting**: Consider using Disabled status instead for archival purposes
2. **Bulk operations**: When disabling a pack, samples keep their Active/Disabled status for when you re-enable
3. **Quality control**: Mark problematic samples as Disabled while keeping the pack Published
4. **Testing**: Use Disabled pack status while preparing new content before launch

## Implementation Notes

This logic should be enforced at:
- **Database level**: RLS policies and views
- **API level**: Query filters
- **Frontend level**: UI hints and validation

The admin panel always shows all items regardless of status for full management capabilities.

# Admin Profile Dropdown Enhancement

## Overview
Updated the admin profile dropdown in the header with comprehensive profile management features including avatar upload, personal information editing, and password management.

## Features Implemented

### 1. Enhanced Profile Dropdown

#### Desktop View
- Real-time admin data fetching from database
- User avatar display (or initials if no avatar)
- Admin name and email
- Status badge (active/pending/disabled)
- Role badge (Super Admin/Content Editor)

#### Mobile View
- Responsive avatar icon
- Same dropdown content as desktop
- Optimized for touch interactions

#### Menu Items
- **Edit Profile** - Opens profile modal for editing
- **Help** - Links to Notion documentation (configurable URL)
- **Log out** - Signs out and redirects to login

### 2. Edit Profile Modal

#### Avatar Management
- **Upload**: Click to browse or drag & drop
- **Preview**: Live preview before saving
- **Remove**: Delete existing avatar
- **Validation**: 
  - Only image files allowed
  - Maximum size: 2MB
  - Supported formats: PNG, JPG, etc.
- **Storage**: Supabase Storage `avatars` bucket

#### Personal Information
- **Full Name**: Editable text field
- **Email**: Read-only (shows note that only Super Admin can change)

#### Password Management
- **Current Password**: Required to change password
- **New Password**: Must be at least 6 characters
- **Confirm Password**: Must match new password
- **Validation**:
  - Verifies current password before updating
  - Ensures new passwords match
  - Optional - leave blank to keep current password

### 3. Database Schema

#### New Migration: `20260209000005_add_user_avatar.sql`
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

#### Updated User Type
```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null; // NEW
  is_admin: boolean;
  role: "full_admin" | "content_editor";
  status: "active" | "pending" | "disabled";
  last_login: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}
```

## Files Modified

### 1. `src/types/index.ts`
- Added `avatar_url` field to User interface

### 2. `src/components/TopBar.tsx`
**Changes:**
- Added `useEffect` to fetch current admin user data on mount
- Added state for `currentUser`, `isProfileModalOpen`, `loading`
- Created helper functions:
  - `fetchCurrentUser()` - Fetches admin data from database
  - `getAvatarUrl()` - Gets public URL from Supabase Storage
  - `getInitials()` - Generates initials from name or email
  - `getStatusVariant()` - Returns badge variant based on status
  - `formatRole()` - Formats role for display
- Updated dropdown to show:
  - Real user avatar or initials
  - Real name and email
  - Status and role badges
- Added "Edit Profile" menu item (opens modal)
- Added "Help" menu item (opens Notion URL)
- Removed old "Settings" and "Admin Panel" menu items
- Integrated EditProfileModal component

### 3. `src/components/EditProfileModal.tsx` (NEW)
**Features:**
- Dialog-based modal interface
- Avatar upload with drag & drop
- File size and type validation
- Avatar preview before saving
- Remove avatar functionality
- Full name editing
- Email display (read-only with explanation)
- Password change section (optional)
- Current password verification
- Password confirmation matching
- Loading states for save/upload operations
- Success/error toast notifications
- Automatic user data refresh on save

## Storage Setup

### Avatars Bucket
The `avatars` storage bucket was already created in a previous migration:
- Location: `supabase/migrations/20260206000001_create_avatars_bucket.sql`
- Public bucket (anyone can view)
- Admins can upload/update/delete
- File path format: `{user_id}/{timestamp}.{extension}`

### RLS Policies
- ✅ Anyone can view avatars (public bucket)
- ✅ Admins can upload avatars
- ✅ Admins can update avatars
- ✅ Admins can delete avatars

## Usage Flow

### Viewing Profile
1. User clicks avatar in header
2. Dropdown shows:
   - Avatar/initials
   - Name and email
   - Status badge (active/pending/disabled)
   - Role badge (Super Admin/Content Editor)
3. Menu options:
   - Edit Profile
   - Help (opens Notion docs)
   - Log out

### Editing Profile
1. Click "Edit Profile" from dropdown
2. Modal opens with current data
3. User can:
   - Upload new avatar (drag & drop or browse)
   - Remove existing avatar
   - Update full name
   - Change password (optional)
4. Click "Save Changes"
5. System validates and saves:
   - Uploads avatar to storage (if changed)
   - Updates user record in database
   - Verifies and updates password (if provided)
6. Success toast shown
7. Modal closes
8. Profile data refreshes automatically

### Password Change Flow
1. Enter current password
2. Enter new password (min 6 characters)
3. Confirm new password
4. System verifies current password
5. If valid, updates to new password
6. User remains logged in

## Configuration

### Help Link URL
Update the Notion URL in `TopBar.tsx`:
```typescript
window.open(
  "https://notion.so/your-internal-docs", // Change this URL
  "_blank"
)
```

### Avatar Size Limit
Change in `EditProfileModal.tsx`:
```typescript
if (file.size > 2 * 1024 * 1024) { // Currently 2MB
  toast.error("Image size must be less than 2MB");
  return;
}
```

## Next Steps

### 1. Apply Database Migration
```bash
npx supabase db push
```
This adds the `avatar_url` column to the users table.

### 2. Update Help Link
Replace `https://notion.so/your-internal-docs` with actual Notion documentation URL in [TopBar.tsx](src/components/TopBar.tsx#L216).

### 3. Test Profile Features
- [ ] Upload avatar
- [ ] Remove avatar
- [ ] Update name
- [ ] Change password
- [ ] Verify status and role badges display correctly
- [ ] Test on mobile devices
- [ ] Verify Help link opens correct URL

### 4. Super Admin Email Editing (Optional)
If Super Admins should be able to edit emails, add logic in `EditProfileModal.tsx`:
```typescript
{isFullAdmin && (
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
)}
```

## Security Considerations

### Avatar Upload
- ✅ File type validation (images only)
- ✅ File size limit (2MB)
- ✅ RLS policies restrict upload to admins
- ✅ Overwrites prevented with unique filenames
- ✅ Old avatars deleted when replaced

### Password Change
- ✅ Current password verification required
- ✅ Minimum length requirement (6 characters)
- ✅ Confirmation matching enforced
- ✅ Uses Supabase Auth for secure password updates
- ✅ User remains authenticated after change

### Email Changes
- ✅ Email field is read-only by default
- ✅ Note shown explaining Super Admin restriction
- ✅ Can be enabled for full_admin role if needed

## UI Components Used

From shadcn/ui:
- `Dialog` - Modal container
- `Input` - Text fields
- `Label` - Field labels
- `Button` - Action buttons
- `Badge` - Status/role indicators
- `Alert` - Info messages
- `DropdownMenu` - Profile dropdown
- `Separator` - Visual dividers

From lucide-react:
- `Upload` - Avatar upload icon
- `X` - Remove icon
- `Loader2` - Loading spinner
- `Eye/EyeOff` - Password visibility toggle
- `Save` - Save button icon
- `LogOut` - Logout icon
- `HelpCircle` - Help icon

## Error Handling

### Avatar Upload Failures
- Network errors caught and displayed as toast
- File validation errors shown immediately
- Storage upload errors handled gracefully
- Old avatar cleanup on failure

### Password Update Failures
- Current password verification errors shown
- Password mismatch errors caught
- Auth errors displayed with context
- User can retry without losing form data

### Profile Update Failures
- Database errors caught and logged
- User-friendly error messages shown
- Form state preserved for retry
- Partial updates prevented (atomic operations)

## Future Enhancements

- [ ] Crop/resize avatar before upload
- [ ] Support for gravatar fallback
- [ ] Profile completion percentage
- [ ] Last login timestamp in dropdown
- [ ] Password strength meter
- [ ] Two-factor authentication toggle
- [ ] Email change verification flow
- [ ] Activity log in profile
- [ ] Notification preferences
- [ ] Profile themes/customization

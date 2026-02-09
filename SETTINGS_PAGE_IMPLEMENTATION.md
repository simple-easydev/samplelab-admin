# Settings Page Implementation

## Overview
A comprehensive Settings page for managing global application configuration values that are used throughout the platform in footers, emails, sign-up screens, and promotional materials.

## Database Structure

### Table: `app_settings`
```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Categories & Settings
1. **General** (`category: 'general'`)
   - `product_name` - Product name used in titles and emails
   - `public_url` - Public-facing URL for emails and redirects
   - `support_email` - Support contact email shown in Help Center and footer
   - `default_timezone` - Default timezone for admin stats

2. **Legal** (`category: 'legal'`)
   - `terms_of_service_url` - Link to Terms of Service (Notion or external)
   - `privacy_policy_url` - Link to Privacy Policy (Notion or external)
   - `cookie_policy_url` - Link to Cookie Policy (optional)

3. **Social** (`category: 'social'`)
   - `instagram_url` - Instagram profile URL
   - `soundcloud_url` - SoundCloud profile URL

4. **Integrations** (`category: 'integrations'`)
   - `stripe_status` - Stripe connection status (read-only)

## UI Structure

### Component: `src/pages/admin/Settings.tsx`

#### Features
- ✅ Form-based settings management
- ✅ Grouped by category in separate cards
- ✅ Change tracking with unsaved changes alert
- ✅ Sticky Save/Cancel buttons at bottom
- ✅ Toast notifications for success/error
- ✅ Loading states
- ✅ Read-only badge for stripe_status
- ✅ Helptext descriptions for each field

#### Sections
```tsx
<Card> General </Card>            // Globe icon
<Card> Legal & Policies </Card>   // FileText icon
<Card> Social Links </Card>       // Share2 icon
<Card> Integrations </Card>       // CreditCard icon
<Actions> Save / Cancel </Actions> // Sticky footer
```

#### State Management
```typescript
const [settings, setSettings] = useState<AppSettings>({...})
const [originalSettings, setOriginalSettings] = useState<AppSettings>({...})
const [hasChanges, setHasChanges] = useState(false)
```

- Tracks current form values
- Stores original values from database
- Compares to detect unsaved changes

#### Data Flow
1. **Load**: `fetchSettings()` runs on mount
   - Fetches all rows from `app_settings`
   - Maps key-value pairs to typed settings object
   - Sets both `settings` and `originalSettings`

2. **Edit**: `handleChange(key, value)` updates local state
   - Updates settings object
   - Triggers change detection

3. **Save**: `handleSave()` bulk updates
   - Loops through all settings
   - Skips `stripe_status` (read-only)
   - Updates database with new values and metadata
   - Updates `originalSettings` to match
   - Shows success toast

4. **Cancel**: `handleCancel()` discards changes
   - Resets settings to originalSettings
   - Shows info toast

## RLS Policies

### View Policy
```sql
-- All admins can view settings
CREATE POLICY "Admins can view settings"
  ON app_settings FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );
```

### Update Policy
```sql
-- Only full_admins can update settings
CREATE POLICY "Full admins can update settings"
  ON app_settings FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM users WHERE admin_role = 'full_admin')
  );
```

## Migration File
Location: `supabase/migrations/20260209000004_create_app_settings.sql`

### Included
- Table creation with proper constraints
- Indexes on `key` and `category`
- Trigger for `updated_at`
- Default values for all 10 settings
- RLS policies for view/update
- Enable RLS on table

## Usage Examples

### In Footer Component
```typescript
const { data: settings } = useSWR('/api/settings', async () => {
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['terms_of_service_url', 'privacy_policy_url', 'instagram_url']);
  return data;
});

<footer>
  <a href={settings.terms_of_service_url}>Terms</a>
  <a href={settings.privacy_policy_url}>Privacy</a>
  <a href={settings.instagram_url}>Instagram</a>
</footer>
```

### In Email Templates
```typescript
const { data: settings } = await supabase
  .from('app_settings')
  .select('value')
  .eq('key', 'product_name')
  .single();

const emailHtml = `
  <h1>Welcome to ${settings.value}!</h1>
  <p>Contact us at ${supportEmail}</p>
`;
```

### In Help Center
```typescript
const supportEmail = await getSetting('support_email');
<p>Need help? Email us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
```

## Next Steps

### 1. Apply Database Migration
```bash
npx supabase db push
```
This creates the `app_settings` table with default values.

### 2. Verify in Admin UI
- Navigate to Settings page
- Check all fields load correctly
- Update a value and save
- Verify changes persist after refresh

### 3. Integrate Settings Across App
Update these components to use settings:
- Footer links (legal URLs, social URLs)
- Email templates (product_name, support_email, public_url)
- Sign-up screens (terms/privacy checkboxes)
- Help Center (support_email)

### 4. Add More Settings (Optional)
To add new settings:
```sql
INSERT INTO app_settings (key, value, category)
VALUES ('new_setting_key', 'default_value', 'category_name');
```

Then update `AppSettings` interface in Settings.tsx.

## Security Considerations
- ✅ RLS policies restrict access to admins only
- ✅ Update restricted to full_admins
- ✅ Stripe status is read-only in UI (can't be changed via form)
- ✅ All updates tracked with `updated_by` and `updated_at`
- ✅ Authentication required (checks session before save)

## Future Enhancements
- [ ] Setting validation (URL format, email format, etc.)
- [ ] Bulk import/export of settings
- [ ] History/audit log of setting changes
- [ ] Setting groups with expand/collapse
- [ ] Preview mode to see how settings affect UI
- [ ] Stripe Connect integration for `stripe_status`

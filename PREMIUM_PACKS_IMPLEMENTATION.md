# Premium Packs Implementation

## Overview

Premium packs are special packs that cost more credits and are available to all paying tiers.

## Requirements

### ✅ Implemented
1. **Premium Toggle** - CreatePack page has a Premium Pack toggle
2. **Database Field** - `is_premium` boolean field in `packs` table
3. **Premium Badge** - Packs table shows a gold "Premium" badge next to pack names

### ⚠️ Partially Implemented
4. **Credit Cost** - Sample-level credit cost override exists, but no automatic premium pricing

## Current Implementation

### 1. Database Schema

**Packs Table:**
```sql
CREATE TABLE packs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,  -- ✓ Premium flag
  ...
);
```

**Samples Table:**
```sql
CREATE TABLE samples (
  id UUID PRIMARY KEY,
  pack_id UUID REFERENCES packs(id),
  credit_cost INTEGER,  -- ✓ Optional override per sample
  ...
);
```

### 2. CreatePack Page

**Premium Toggle:**
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg">
  <div>
    <Label className="text-base font-medium">Premium Pack Toggle</Label>
    <p className="text-sm text-muted-foreground">
      Premium packs require special access or subscription
    </p>
  </div>
  <Button
    variant={formData.isPremium ? "default" : "outline"}
    onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
  >
    {formData.isPremium ? "Premium" : "Standard"}
  </Button>
</div>
```

**Credit Cost Override (Per Sample):**
```tsx
<div className="space-y-1">
  <Label className="text-xs">Credit Cost Override (optional)</Label>
  <Input
    type="number"
    placeholder="Leave empty for default cost"
    value={sample.creditCost}
    onChange={(e) => handleSampleChange(sample.id, "creditCost", e.target.value)}
  />
</div>
```

### 3. PacksTab Display

**Premium Badge:**
```tsx
<TableCell className="font-medium">
  <div className="flex items-center gap-2">
    <Link to={`/admin/library/packs/${pack.id}`}>
      {pack.name}
    </Link>
    {pack.is_premium && (
      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">
        Premium
      </Badge>
    )}
  </div>
</TableCell>
```

**Badge Style:**
- Gold/Amber color (#F59E0B)
- Displayed next to pack name
- Only shows for premium packs

## Credit Cost Logic

### Current System (Manual)
Admins can manually set credit cost per sample:
- **Standard samples**: Default credit cost (defined in app settings)
- **Premium samples**: Admin enters higher cost manually

### Recommended System (Automatic)

#### Option 1: Pack-Level Multiplier
```typescript
// In sample creation/display logic
const getEffectiveCreditCost = (sample, pack) => {
  // If sample has manual override, use it
  if (sample.credit_cost) return sample.credit_cost;
  
  // Otherwise, use default cost with premium multiplier
  const defaultCost = 2; // Standard sample cost
  const premiumMultiplier = 4; // 4x for premium (2 → 8)
  
  return pack.is_premium 
    ? defaultCost * premiumMultiplier 
    : defaultCost;
};
```

#### Option 2: Pack-Level Default Cost
Add to packs table:
```sql
ALTER TABLE packs ADD COLUMN default_credit_cost INTEGER DEFAULT 2;
```

Then use:
```typescript
const getEffectiveCreditCost = (sample, pack) => {
  return sample.credit_cost || pack.default_credit_cost || 2;
};
```

#### Option 3: Global Settings with Premium Tier
```typescript
// Global credit cost configuration
const CREDIT_COSTS = {
  standard: {
    oneShot: 2,
    loop: 3,
    stem: 5,
  },
  premium: {
    oneShot: 8,
    loop: 10,
    stem: 12,
  }
};

const getEffectiveCreditCost = (sample, pack) => {
  if (sample.credit_cost) return sample.credit_cost;
  
  const tier = pack.is_premium ? 'premium' : 'standard';
  const typeKey = sample.type.toLowerCase().replace('-', '');
  
  return CREDIT_COSTS[tier][typeKey] || CREDIT_COSTS.standard.oneShot;
};
```

## Recommended Implementation

### Step 1: Add Global Credit Cost Configuration

Create `src/config/credits.ts`:
```typescript
export const CREDIT_COSTS = {
  standard: {
    'One-shot': 2,
    'Loop': 3,
    'Stem': 5,
  },
  premium: {
    'One-shot': 8,
    'Loop': 10,
    'Stem': 12,
  }
};

export function calculateCreditCost(
  sampleType: string,
  isPremium: boolean,
  manualOverride?: number
): number {
  // Manual override takes precedence
  if (manualOverride !== undefined && manualOverride !== null) {
    return manualOverride;
  }
  
  // Auto-calculate based on type and premium status
  const tier = isPremium ? 'premium' : 'standard';
  return CREDIT_COSTS[tier][sampleType] || CREDIT_COSTS.standard['One-shot'];
}
```

### Step 2: Update CreatePack Page

Add credit cost preview for samples:
```tsx
{/* Show calculated cost */}
<div className="text-xs text-muted-foreground">
  Default cost: {calculateCreditCost(sample.type, formData.isPremium)} credits
  {sample.creditCost && (
    <span className="text-blue-600 ml-1">
      (Override: {sample.creditCost} credits)
    </span>
  )}
</div>
```

### Step 3: Update Database on Pack Creation

In `createPackWithSamples()`:
```typescript
const samplesData = sampleFiles.map((sample) => ({
  // ... other fields
  credit_cost: sample.creditCost 
    ? parseInt(sample.creditCost)
    : calculateCreditCost(sample.type, formData.isPremium),
}));
```

### Step 4: Display Credit Cost in Tables

Add a "Credits" column to samples table:
```tsx
<TableHead className="text-right">Credits</TableHead>
...
<TableCell className="text-right">
  <Badge variant={pack.is_premium ? "default" : "secondary"}>
    {sample.credit_cost || calculateCreditCost(sample.type, pack.is_premium)}
  </Badge>
</TableCell>
```

## User-Facing Features

### For Admins
1. ✅ Toggle premium status when creating pack
2. ✅ See "Premium" badge in packs table
3. ⚠️ Set manual credit cost per sample (works but no auto-calculation)
4. 🔄 See auto-calculated credit costs with premium multiplier (recommended)

### For End Users (Frontend App)
1. See "Premium" badge on pack tiles
2. See higher credit cost before download
3. Can download with sufficient credits (any paying tier)
4. Premium packs clearly marked throughout app

## Testing Checklist

### Admin Panel
- [ ] Create a standard pack with samples
- [ ] Create a premium pack with samples
- [ ] Verify premium badge shows in packs table
- [ ] Verify credit costs are saved correctly
- [ ] Edit pack to toggle premium on/off

### Frontend App (TODO)
- [ ] Premium badge displays on pack cards
- [ ] Premium samples show higher credit cost
- [ ] Users can download premium samples with sufficient credits
- [ ] All paying tiers have access to premium packs

## Configuration

### Current Settings
```typescript
// These need to be centralized
const DEFAULT_CREDIT_COSTS = {
  standard: {
    oneShot: 2,
    loop: 3,
    stem: 5,
  },
  premium: {
    oneShot: 8,    // 4x multiplier
    loop: 10,      // ~3.3x multiplier
    stem: 12,      // 2.4x multiplier
  }
};
```

### Adjust Credit Costs
To change credit costs, update `src/config/credits.ts` (after implementing):
```typescript
export const CREDIT_COSTS = {
  standard: {
    'One-shot': 2,   // Change these values
    'Loop': 3,
    'Stem': 5,
  },
  premium: {
    'One-shot': 8,   // Change these values
    'Loop': 10,
    'Stem': 12,
  }
};
```

## Database Queries

### Get Premium Packs
```sql
SELECT * FROM packs WHERE is_premium = true;
```

### Get Premium Samples with Costs
```sql
SELECT 
  s.*,
  p.is_premium,
  COALESCE(s.credit_cost, CASE 
    WHEN p.is_premium THEN 
      CASE s.type
        WHEN 'One-shot' THEN 8
        WHEN 'Loop' THEN 10
        WHEN 'Stem' THEN 12
      END
    ELSE 
      CASE s.type
        WHEN 'One-shot' THEN 2
        WHEN 'Loop' THEN 3
        WHEN 'Stem' THEN 5
      END
  END) as effective_credit_cost
FROM samples s
JOIN packs p ON s.pack_id = p.id;
```

### Update Pack Premium Status
```sql
UPDATE packs 
SET is_premium = true 
WHERE id = 'pack-uuid-here';
```

## UI Examples

### Premium Badge in Table
```
┌────────────────────────────────────────┐
│ Pack Name             │ Creator │ ...  │
├────────────────────────────────────────┤
│ Trap Kit Vol.1        │ Mike    │ ...  │
│ Premium Vocals 🏅     │ Sara    │ ...  │
│ Lo-Fi Beats           │ Alex    │ ...  │
└────────────────────────────────────────┘
```

### Premium Pack Card (Frontend)
```
┌──────────────────────┐
│ [Cover Image]        │
│                      │
│ 🏅 PREMIUM           │
│ Trap Essentials      │
│ By Producer Mike     │
│                      │
│ 45 samples           │
│ 8-10 credits/sample  │
└──────────────────────┘
```

## API Response Example

```json
{
  "id": "uuid",
  "name": "Premium Trap Kit",
  "is_premium": true,
  "samples": [
    {
      "id": "uuid",
      "name": "808 Bass",
      "type": "One-shot",
      "credit_cost": 8,
      "effective_credit_cost": 8
    },
    {
      "id": "uuid", 
      "name": "Drum Loop",
      "type": "Loop",
      "credit_cost": null,
      "effective_credit_cost": 10
    }
  ]
}
```

## Related Files

- `src/components/library/PacksTab.tsx` - Premium badge display
- `src/pages/admin/library/CreatePack.tsx` - Premium toggle
- `supabase/migrations/20260205000004_create_packs_and_samples_system.sql` - Database schema
- `src/config/credits.ts` - (TODO) Credit cost configuration

## Next Steps

1. ✅ **Add Premium Badge** - Done in PacksTab
2. 🔄 **Create Credits Configuration** - `src/config/credits.ts`
3. 🔄 **Auto-Calculate Credit Costs** - Use premium multiplier
4. 🔄 **Show Credit Costs in UI** - Add Credits column to samples table
5. 🔄 **Update CreatePack Preview** - Show calculated costs
6. 🔄 **Frontend Integration** - Display premium badges and costs in user-facing app

## Support

For questions about premium packs:
1. Check if `is_premium` field is true in database
2. Verify premium badge displays in admin panel
3. Check credit cost calculation logic
4. Ensure frontend app shows premium indicators

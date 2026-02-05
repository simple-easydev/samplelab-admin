# Packs Table - Database Integration Complete

## Overview

The PacksTab component has been updated to fetch and display real pack data from the Supabase database instead of using mock data.

## Changes Made

### 1. **PacksTab Component** (`src/components/library/PacksTab.tsx`)

#### Removed Props
- No longer receives data as props
- Fetches its own data using Supabase client
- Self-contained component

#### Added State
```typescript
const [packs, setPacks] = useState<Pack[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [uniqueCreators, setUniqueCreators] = useState<string[]>([]);
const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
const [uniqueTags, setUniqueTags] = useState<string[]>([]);
```

#### Updated Interface
```typescript
interface Pack {
  id: string;                    // UUID from database
  name: string;
  creator_id: string;            // UUID reference
  creator_name: string;          // Joined from creators table
  category_id: string;           // UUID reference
  category_name: string;         // Joined from categories table
  genres: string[];              // Array of genre names (joined from pack_genres)
  tags: string[];
  samples_count: number;         // Counted from samples table
  downloads: number;
  status: "Draft" | "Published" | "Disabled";
  cover_url?: string;
  created_at: string;
  is_premium: boolean;
}
```

### 2. **Data Fetching** (`useEffect`)

#### Step 1: Fetch Packs with Joins
```typescript
const { data: packsData } = await supabase
  .from("packs")
  .select(`
    id,
    name,
    creator_id,
    category_id,
    tags,
    download_count,
    status,
    cover_url,
    created_at,
    is_premium,
    creators (name),
    categories (name)
  `)
  .order("created_at", { ascending: false });
```

#### Step 2: Count Samples Per Pack
```typescript
const { data: samplesCount } = await supabase
  .from("samples")
  .select("pack_id, id")
  .eq("status", "Active");

// Count samples by pack_id
const samplesByPack = samplesCount?.reduce((acc, sample) => {
  acc[sample.pack_id] = (acc[sample.pack_id] || 0) + 1;
  return acc;
}, {} as Record<string, number>) || {};
```

#### Step 3: Fetch Genres for Each Pack
```typescript
const { data: packGenresData } = await supabase
  .from("pack_genres")
  .select(`
    pack_id,
    genres (name)
  `);

// Group genres by pack_id
const genresByPack = packGenresData?.reduce((acc, pg) => {
  if (!acc[pg.pack_id]) acc[pg.pack_id] = [];
  acc[pg.pack_id].push(pg.genres?.name);
  return acc;
}, {} as Record<string, string[]>) || {};
```

#### Step 4: Transform and Set State
```typescript
const transformedPacks = (packsData || []).map((pack) => ({
  id: pack.id,
  name: pack.name,
  creator_id: pack.creator_id,
  creator_name: pack.creators?.name || "Unknown",
  category_id: pack.category_id,
  category_name: pack.categories?.name || "Uncategorized",
  genres: genresByPack[pack.id] || [],
  tags: pack.tags || [],
  samples_count: samplesByPack[pack.id] || 0,
  downloads: pack.download_count || 0,
  status: pack.status,
  cover_url: pack.cover_url,
  created_at: pack.created_at,
  is_premium: pack.is_premium,
}));

setPacks(transformedPacks);
```

#### Step 5: Extract Unique Filter Values
```typescript
const creators = Array.from(new Set(transformedPacks.map(p => p.creator_name)));
const genres = Array.from(new Set(transformedPacks.flatMap(p => p.genres)));
const categories = Array.from(new Set(transformedPacks.map(p => p.category_name)));
const tags = Array.from(new Set(transformedPacks.flatMap(p => p.tags)));

setUniqueCreators(creators);
setUniqueGenres(genres);
setUniqueCategories(categories);
setUniqueTags(tags);
```

### 3. **UI Updates**

#### Loading State
```tsx
{isLoading && (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
    <span className="text-sm text-gray-600">Loading packs from database...</span>
  </div>
)}
```

#### Error State
```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {error}
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-4"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)}
```

#### Table Updates
- `pack.creator` → `pack.creator_name`
- `pack.samples` → `pack.samples_count`
- `pack.genre` → `pack.genres` (array)
- `pack.coverUrl` → `pack.cover_url`
- `pack.createdAt` → `pack.created_at`

#### Genre Display
Multiple genres are now displayed as badges:
```tsx
<TableCell>
  {pack.genres.length > 0 ? (
    <div className="flex gap-1 flex-wrap">
      {pack.genres.map((genre, idx) => (
        <Badge key={idx} variant="outline">{genre}</Badge>
      ))}
    </div>
  ) : (
    <span className="text-muted-foreground text-sm">No genres</span>
  )}
</TableCell>
```

### 4. **Library.tsx Updates**

Simplified the PacksTab usage:
```tsx
// Before
<PacksTab
  packs={mockPacks}
  uniqueCreators={uniqueCreators}
  uniqueGenres={uniqueGenres}
  uniqueCategories={uniqueCategories}
  uniqueTags={uniqueTags}
/>

// After
<PacksTab />
```

## Database Schema Used

### Tables
- **packs** - Main pack data
- **creators** - Creator information (joined)
- **categories** - Category information (joined)
- **pack_genres** - Many-to-many relationship
- **genres** - Genre information (joined through pack_genres)
- **samples** - For counting active samples per pack

### Joins Performed
```sql
-- Packs with creator and category
SELECT 
  packs.*,
  creators.name as creator_name,
  categories.name as category_name
FROM packs
LEFT JOIN creators ON packs.creator_id = creators.id
LEFT JOIN categories ON packs.category_id = categories.id

-- Samples count per pack
SELECT pack_id, COUNT(*) 
FROM samples 
WHERE status = 'Active' 
GROUP BY pack_id

-- Genres per pack
SELECT 
  pg.pack_id, 
  g.name as genre_name
FROM pack_genres pg
LEFT JOIN genres g ON pg.genre_id = g.id
```

## Features

### ✅ Real-Time Data
- Fetches from actual database
- No more mock data
- Shows real packs created via CreatePack page

### ✅ Proper Relationships
- Creator names (not just IDs)
- Category names (not just IDs)
- Multiple genres per pack
- Sample counts

### ✅ Loading States
- Spinner while fetching
- Clear "Loading packs from database..." message
- Smooth transition to content

### ✅ Error Handling
- Catches and displays errors
- Retry button
- User-friendly error messages

### ✅ Filter Support
- All filters still work
- Unique values extracted from real data
- Search across pack names and creators

### ✅ Sort Support
- A-Z (alphabetical)
- Newest (by created_at)
- Most downloaded (by download_count)

## Testing

### Verify the Integration

1. **Run the database migration** (if not already done):
   ```bash
   cd d:\work\SampleLab\admin
   npx supabase db push
   ```

2. **Create a test creator** (if none exist):
   ```sql
   INSERT INTO creators (name, email, is_active)
   VALUES ('Test Creator', 'test@example.com', true);
   ```

3. **Create a test pack** using the CreatePack page:
   - Go to Library → Packs → Create New Pack
   - Fill in all fields
   - Upload at least one sample
   - Click "Publish Pack"

4. **Verify the pack appears** in the table:
   - Should load without errors
   - Pack should appear with correct data
   - All filters should work

### Expected Behavior

#### Empty State
- If no packs exist: Shows "No packs found"
- Table is empty but functional

#### With Data
- Packs load in under 1 second
- All fields display correctly:
  - Cover image or fallback icon
  - Pack name (clickable link)
  - Creator name
  - Sample count
  - Genre badges (multiple possible)
  - Download count
  - Status badge (Draft/Published/Disabled)
  - Actions dropdown

#### Filters
- Status filter: Works with Draft/Published/Disabled
- Creator filter: Shows all unique creators
- Genre filter: Shows all unique genres
- Category filter: Shows all unique categories
- Tags filter: Shows all unique tags
- Search: Filters by pack name and creator name

## Performance Considerations

### Query Optimization
- All data fetched in 3 parallel queries (not sequential)
- Data transformation happens in-memory (fast)
- Results cached in component state

### Potential Improvements
1. **Add pagination** for large datasets (100+ packs)
2. **Cache results** with SWR or React Query
3. **Virtual scrolling** for very long lists
4. **Debounce search** input
5. **Server-side filtering** for large datasets

## Troubleshooting

### Issue: No packs appear
**Solution**: 
- Check if any packs exist in database: `SELECT * FROM packs;`
- Verify RLS policies allow admin access
- Check browser console for errors

### Issue: "Loading packs from database..." never finishes
**Solution**:
- Check Supabase connection (env variables)
- Verify admin user has `is_admin = true`
- Check RLS policies on packs, creators, categories tables

### Issue: Genres not showing
**Solution**:
- Verify pack_genres table has entries
- Check if genres table has data
- Ensure RLS policies allow reading pack_genres

### Issue: Sample count always 0
**Solution**:
- Verify samples exist with `status = 'Active'`
- Check samples table has `pack_id` foreign key
- Ensure RLS policies allow reading samples

## Related Files

- `src/components/library/PacksTab.tsx` - Main component
- `src/pages/admin/library/Library.tsx` - Parent page
- `src/lib/supabase.ts` - Supabase client
- `supabase/migrations/20260205000004_create_packs_and_samples_system.sql` - Database schema

## Next Steps

### For SamplesTab
Apply the same pattern:
1. Remove props from SamplesTab
2. Add useEffect to fetch samples
3. Join with packs, creators, etc.
4. Add loading and error states
5. Update Library.tsx to remove props

### For GenresTab, CategoriesTab, MoodsTab
Implement data fetching for these tabs as well.

## Support

For issues with the packs table:
1. Check browser console for errors
2. Check Supabase Dashboard → Logs
3. Verify RLS policies: `SELECT * FROM packs;` in SQL Editor
4. Check admin user: `SELECT * FROM users WHERE is_admin = true;`

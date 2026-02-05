# Component Structure - Library Module

This document explains the refactored component structure for the Library management module.

## 📁 File Organization

```
src/
├── pages/
│   └── admin/
│       └── Library.tsx              # Main page (routing & data)
└── components/
    └── library/
        ├── PacksTab.tsx            # Packs management component
        ├── SamplesTab.tsx          # Samples management component
        ├── GenresTab.tsx           # Genres management component
        ├── CategoriesTab.tsx       # Categories management component
        └── MoodsTab.tsx            # Moods management component
```

## 🎯 Component Responsibilities

### Library.tsx (Main Page)
**Location:** `src/pages/admin/Library.tsx`

**Responsibilities:**
- Route parameter management (tab switching via URL)
- Mock data definition (will be replaced with API calls)
- Data aggregation (unique values for filters)
- Tab navigation UI
- Passing data to child components

**Size:** ~300 lines (reduced from 1228 lines!)

**Key Features:**
```typescript
- Tab state management via URL params
- Mock data for packs and samples
- Unique value extraction for filters
- Component composition
```

### PacksTab.tsx
**Location:** `src/components/library/PacksTab.tsx`

**Responsibilities:**
- Display packs in a table
- Search functionality (pack name, creator)
- 5 filter options: Creator, Genre, Category, Tags, Status
- 3 sort options: A-Z, Newest, Most Downloaded
- Pack actions: View, Edit, Publish/Disable, Delete
- Active filter badges with clear functionality

**Props:**
```typescript
interface PacksTabProps {
  packs: Pack[];
  uniqueCreators: string[];
  uniqueGenres: string[];
  uniqueCategories: string[];
  uniqueTags: string[];
}
```

### SamplesTab.tsx
**Location:** `src/components/library/SamplesTab.tsx`

**Responsibilities:**
- Display samples in a table
- Search functionality (sample name, pack, creator)
- 7 filter options: Type, Pack, Creator, Genre, BPM Range, Key, Status
- 3 sort options: A-Z, Newest, Most Downloaded
- Sample actions: View Pack, Edit, Play Preview, Activate/Disable, Delete
- Active filter badges with clear functionality
- Info alert about Pack-First Architecture

**Props:**
```typescript
interface SamplesTabProps {
  samples: Sample[];
  uniqueTypes: string[];
  uniquePacks: string[];
  uniqueCreators: string[];
  uniqueGenres: string[];
  uniqueKeys: string[];
}
```

### GenresTab.tsx, CategoriesTab.tsx, MoodsTab.tsx
**Location:** `src/components/library/[TabName].tsx`

**Responsibilities:**
- Placeholder "Coming Soon" UI
- Maintains consistent card-based layout
- Ready for future implementation

## 🔄 Data Flow

```
Library.tsx (Data Source)
    │
    ├─→ Defines mockPacks & mockSamples
    ├─→ Extracts unique values for filters
    ├─→ Manages URL-based tab state
    │
    └─→ Passes data as props to:
        ├─→ PacksTab
        ├─→ SamplesTab
        ├─→ GenresTab (no props needed)
        ├─→ CategoriesTab (no props needed)
        └─→ MoodsTab (no props needed)
```

## 💡 Benefits of This Structure

### 1. **Separation of Concerns**
- Main page handles routing and data
- Tab components handle UI and interactions
- Clear, single responsibility for each component

### 2. **Maintainability**
- Reduced file size (1228 lines → ~300 + 5 smaller files)
- Easier to locate and fix bugs
- Self-contained components

### 3. **Reusability**
- Components can be imported elsewhere if needed
- Easy to create similar patterns for other modules

### 4. **Testability**
- Each component can be tested independently
- Props are well-defined interfaces
- Mock data can be passed easily

### 5. **Scalability**
- Easy to add new tabs
- Simple to extend existing tabs
- Clear pattern to follow

## 🔧 Making Changes

### Adding a New Filter to PacksTab
1. Update props interface if needed
2. Add state for new filter
3. Add dropdown in UI
4. Update filter logic in `filteredAndSortedPacks`
5. Update `clearFilters` function
6. Update `activeFiltersCount`

### Adding a New Tab
1. Create new component in `src/components/library/`
2. Import in `Library.tsx`
3. Add to `TabsList`
4. Add to `TabsContent` with your component
5. Update `LibraryTab` type if needed

### Replacing Mock Data with API
1. In `Library.tsx`, replace mock data with API calls
2. Use `useEffect` to fetch data on mount
3. Add loading states
4. Handle errors gracefully
5. Pass fetched data to tab components (props stay the same!)

## 📝 Example: Migrating to API

### Before (Mock Data)
```typescript
const mockPacks = [...];
```

### After (API Call)
```typescript
const [packs, setPacks] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchPacks() {
    try {
      const { data, error } = await supabase
        .from('packs')
        .select('*');
      
      if (error) throw error;
      setPacks(data);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  }
  
  fetchPacks();
}, []);

// Pass to component
<PacksTab packs={packs} ... />
```

## 🎨 UI Patterns Used

### Consistent Patterns Across Tabs:
- **Card wrapper** with header and content
- **Search bar** at the top
- **Filter dropdowns** in a row
- **Sort dropdown** on the right
- **Clear filters button** (when filters active)
- **Active filter badges** below filters
- **Results counter** above table
- **Table** with consistent column structure
- **Action dropdown** in last column

## 🚀 Future Enhancements

Potential improvements to consider:

1. **Shared Filter Component**
   - Extract common filter UI into reusable component
   - Reduce code duplication

2. **Custom Hooks**
   - `useTableFilters()` - Manage filter state
   - `useTableSort()` - Manage sort state
   - `useSearch()` - Manage search state

3. **Virtualization**
   - For large datasets, implement virtual scrolling
   - Use `react-virtual` or similar

4. **Pagination**
   - Server-side pagination for better performance
   - Page size selector

5. **Bulk Actions**
   - Checkbox selection
   - Bulk status changes
   - Bulk delete with confirmation

## 📚 Related Documentation

- [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) - Pack-first architecture
- [PACK_SAMPLE_STATUS_LOGIC.md](./PACK_SAMPLE_STATUS_LOGIC.md) - Status rules
- [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) - Overall architecture

## 🔍 Quick Reference

| File | Lines | Purpose |
|------|-------|---------|
| `Library.tsx` | ~300 | Main page, data & routing |
| `PacksTab.tsx` | ~450 | Pack management UI |
| `SamplesTab.tsx` | ~550 | Sample management UI |
| `GenresTab.tsx` | ~25 | Genre placeholder |
| `CategoriesTab.tsx` | ~25 | Category placeholder |
| `MoodsTab.tsx` | ~25 | Mood placeholder |
| **Total** | **~1375** | *Organized & maintainable* |

---

**Note:** The total line count increased slightly due to the addition of proper interfaces, imports, and cleaner separation, but each file is now focused and manageable. The improved organization far outweighs the minor increase in total lines.

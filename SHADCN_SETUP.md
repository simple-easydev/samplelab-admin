# shadcn/ui Integration

Successfully integrated **shadcn/ui** components into the admin panel.

## Components Added

The following shadcn components were installed:
- ✅ **Button** - Used for all action buttons
- ✅ **Input** - Used for text inputs and search fields
- ✅ **Table** - Used for UsersTable and CustomerTable  
- ✅ **Card** - Used for stat cards and containers
- ✅ **Badge** - Used for status indicators (admin, subscription tiers, etc.)
- ✅ **Skeleton** - Used for loading states
- ✅ **Alert** - Used for error messages

## Updated Components

### Tables
- **`src/components/UsersTable.tsx`** - Now uses shadcn Table, Input, Badge, Button, Card
- **`src/components/CustomerTable.tsx`** - Now uses shadcn Table, Input, Badge, Button, Card

### Loading States
- **`src/components/LoadingSkeleton.tsx`** - Now uses shadcn Skeleton and Card

### Pages
- **`src/pages/admin/Users.tsx`** - Uses Button and Alert
- **`src/pages/admin/Customers.tsx`** - Uses Button and Alert

## Configuration

- **Tailwind config** (`tailwind.config.ts`) - Updated with shadcn color variables and design tokens
- **CSS** (`src/index.css`) - Added shadcn layer with HSL color variables for light/dark mode
- **Utils** (`src/lib/utils.ts`) - Added `cn()` helper for className merging

## Design System

shadcn uses a neutral color scheme with:
- Semantic color variables (primary, secondary, muted, destructive, etc.)
- HSL values for easy theme customization
- CSS variables for consistent spacing and radius
- Dark mode support (add `dark` class to enable)

## Next Steps

To add more shadcn components:
```bash
npx shadcn@latest add [component-name]
```

Available components: dialog, dropdown-menu, select, checkbox, switch, tabs, tooltip, etc.

See: https://ui.shadcn.com/docs/components

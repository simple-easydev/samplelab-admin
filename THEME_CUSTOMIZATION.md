# Theme Customization Guide

This guide explains how to customize the colors and styling of the admin panel.

## 📁 Theme Configuration File

All theme colors are centralized in: `src/config/theme.ts`

## 🎨 Customizing Navigation Colors

To change the colors of navigation items, edit the `navigationColors` object:

```typescript
export const navigationColors = {
  dashboard: {
    color: "text-blue-500",      // Icon & text color when active
    bgColor: "bg-blue-500/10",    // Background color when active
    hoverColor: "hover:bg-blue-500/20", // Background on hover
  },
  // ... more items
}
```

### Example: Change to Warm Colors

```typescript
dashboard: {
  color: "text-amber-600",
  bgColor: "bg-amber-500/10",
  hoverColor: "hover:bg-amber-500/20",
},
samples: {
  color: "text-orange-600",
  bgColor: "bg-orange-500/10",
  hoverColor: "hover:bg-orange-500/20",
},
```

### Example: Monochrome Theme

```typescript
dashboard: {
  color: "text-gray-900",
  bgColor: "bg-gray-100",
  hoverColor: "hover:bg-gray-200",
},
```

## 🌈 Sidebar Styling

### Background Gradients

```typescript
export const sidebarTheme = {
  background: {
    from: "from-slate-50",        // Light mode gradient start
    to: "to-white",               // Light mode gradient end
    darkFrom: "dark:from-slate-900", // Dark mode gradient start
    darkTo: "dark:to-slate-950",  // Dark mode gradient end
  },
}
```

### Header Section

```typescript
header: {
  background: "from-blue-50 to-purple-50",
  darkBackground: "dark:from-blue-950/20 dark:to-purple-950/20",
  border: "border-slate-200 dark:border-slate-800",
},
```

### Logo & Brand

```typescript
logo: {
  gradient: "from-blue-600 to-purple-600",  // Logo icon gradient
  shadow: "shadow-blue-500/50",             // Logo shadow color
  textGradient: "from-blue-600 to-purple-600", // Brand text gradient
},
```

## 🎯 Available Tailwind Colors

You can use any Tailwind CSS color:

- **Slate**: `slate-50` to `slate-950`
- **Gray**: `gray-50` to `gray-950`
- **Blue**: `blue-50` to `blue-950`
- **Purple**: `purple-50` to `purple-950`
- **Green**: `green-50` to `green-950`
- **Orange**: `orange-50` to `orange-950`
- **Pink**: `pink-50` to `pink-950`
- **Red**: `red-50` to `red-950`
- **Amber**: `amber-50` to `amber-950`
- **Emerald**: `emerald-50` to `emerald-950`
- **Cyan**: `cyan-50` to `cyan-950`

## 📱 Mobile Responsive Features

The admin panel includes mobile-optimized features:

### TopBar
- **Desktop**: Full search bar visible
- **Mobile**: Search icon button → expandable overlay
- **User Menu**: Full info on desktop, avatar only on mobile

### Sidebar
- **Desktop**: Collapsible to icon-only mode
- **Mobile**: Drawer that slides from left with overlay

### Content Area
- **Responsive padding**: `p-4` on mobile, `md:p-6`, `lg:p-8`
- **Proper spacing**: Adjusts based on screen size

## 🔄 Quick Theme Examples

### Dark & Moody

```typescript
export const sidebarTheme = {
  background: {
    from: "from-slate-900",
    to: "to-slate-950",
    darkFrom: "dark:from-black",
    darkTo: "dark:to-slate-950",
  },
  header: {
    background: "from-slate-800 to-slate-900",
    darkBackground: "dark:from-slate-950 dark:to-black",
  },
}

export const navigationColors = {
  dashboard: {
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    hoverColor: "hover:bg-cyan-500/30",
  },
}
```

### Vibrant & Playful

```typescript
export const navigationColors = {
  dashboard: {
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    hoverColor: "hover:bg-rose-500/20",
  },
  samples: {
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    hoverColor: "hover:bg-fuchsia-500/20",
  },
  customers: {
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverColor: "hover:bg-emerald-500/20",
  },
}
```

### Professional Blue

```typescript
export const navigationColors = {
  dashboard: {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
  samples: {
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
}
```

## 💡 Tips

1. **Consistency**: Keep similar opacity levels (e.g., all `/10` or all `/20`)
2. **Contrast**: Ensure text is readable against backgrounds
3. **Test Dark Mode**: Check both light and dark themes
4. **Gradient Match**: Keep logo and brand gradients complementary

## 🚀 After Making Changes

Changes to `src/config/theme.ts` will hot-reload automatically with Vite!

No build or restart needed.

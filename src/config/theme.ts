/**
 * Admin Panel Theme Configuration
 * 
 * Customize your sidebar and admin panel colors here.
 */

export const sidebarTheme = {
  // Sidebar background gradients
  background: {
    from: "from-slate-50",
    to: "to-white",
    darkFrom: "dark:from-slate-900",
    darkTo: "dark:to-slate-950",
  },

  // Header section styling
  header: {
    background: "from-blue-50 to-purple-50",
    darkBackground: "dark:from-blue-950/20 dark:to-purple-950/20",
    border: "border-slate-200 dark:border-slate-800",
  },

  // Footer section styling
  footer: {
    background: "from-slate-50 to-blue-50",
    darkBackground: "dark:from-slate-900 dark:to-blue-950/20",
    border: "border-slate-200 dark:border-slate-800",
  },

  // Logo styling
  logo: {
    gradient: "from-blue-600 to-purple-600",
    shadow: "shadow-blue-500/50",
    textGradient: "from-blue-600 to-purple-600",
  },

  // User avatar styling
  avatar: {
    gradient: "from-blue-600 to-purple-600",
  },
} as const;

/**
 * Navigation colors are now configured in src/config/navigation.ts
 * Each menu item can have its own color scheme.
 */

/**
 * Admin Panel Theme Configuration
 * 
 * Customize your sidebar and admin panel colors here.
 * Each navigation item can have its own color scheme.
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
 * Navigation items color configuration
 * 
 * Each item has:
 * - color: Text and icon color when active
 * - bgColor: Background color when active
 * - hoverColor: Background color on hover
 */
export const navigationColors = {
  dashboard: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
  },
  samples: {
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    hoverColor: "hover:bg-purple-500/20",
  },
  customers: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    hoverColor: "hover:bg-green-500/20",
  },
  users: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    hoverColor: "hover:bg-orange-500/20",
  },
  analytics: {
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    hoverColor: "hover:bg-pink-500/20",
  },
} as const;

/**
 * Example: Change to a different color scheme
 * 
 * To use a warm color scheme, replace the colors above with:
 * 
 * dashboard: {
 *   color: "text-amber-500",
 *   bgColor: "bg-amber-500/10",
 *   hoverColor: "hover:bg-amber-500/20",
 * }
 * 
 * Or for a monochrome scheme:
 * 
 * dashboard: {
 *   color: "text-gray-700",
 *   bgColor: "bg-gray-100",
 *   hoverColor: "hover:bg-gray-200",
 * }
 */

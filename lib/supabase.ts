// Re-export from separate files to avoid server/client conflicts
// Use these exports for backward compatibility

// For client components, import from @/lib/supabase-browser
export { createBrowserClient } from "./supabase-browser";

// For server components, import from @/lib/supabase-server
export { createServerClient, createAdminClient } from "./supabase-server";

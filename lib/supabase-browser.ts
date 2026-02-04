import { createBrowserClient as createBrowserSSRClient } from "@supabase/ssr";
import { Database } from "@/types/database";

// Browser client for client-side operations
export const createBrowserClient = () => {
  return createBrowserSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

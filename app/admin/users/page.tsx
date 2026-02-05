import { Suspense } from "react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import UsersTable from "@/components/UsersTable";
import { createServerClient } from "@/lib/supabase-server";
import type { User } from "@/types";

// Force dynamic rendering for server components that use cookies
export const dynamic = 'force-dynamic';

// Server Component - fetches data directly
async function UsersData() {
  const supabase = await createServerClient();
  
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return <UsersTable users={users || []} />;
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage admin users and system access
          </p>
        </div>
        <a
          href="/admin/users/invite"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <span>📧</span>
          <span>Invite Admin</span>
        </a>
      </div>

      {/* Users Table with Suspense */}
      <Suspense fallback={<><div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse"><div className="h-10 bg-gray-200 rounded w-full"></div></div><TableSkeleton rows={8} /></>}>
        <UsersData />
      </Suspense>
    </div>
  );
}

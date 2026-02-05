import { Suspense } from "react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import CustomerTable from "@/components/CustomerTable";
import { createServerClient } from "@/lib/supabase-server";

// Force dynamic rendering for server components that use cookies
export const dynamic = 'force-dynamic';

// Server Component - fetches data directly
async function CustomersData() {
  const supabase = await createServerClient();
  
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return <CustomerTable customers={customers || []} />;
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all platform customers
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Add Customer
        </button>
      </div>

      {/* Customers Table with Suspense */}
      <Suspense fallback={<><div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse"><div className="h-10 bg-gray-200 rounded w-full"></div></div><TableSkeleton rows={10} /></>}>
        <CustomersData />
      </Suspense>
    </div>
  );
}

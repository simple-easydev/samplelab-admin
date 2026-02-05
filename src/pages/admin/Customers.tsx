import { TableSkeleton } from "@/components/LoadingSkeleton";
import CustomerTable from "@/components/CustomerTable";
import { useCustomers } from "@/hooks/useAdminData";

export default function CustomersPage() {
  const { customers, isLoading, isError } = useCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">View and manage all platform customers</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Add Customer
        </button>
      </div>

      {isLoading ? (
        <>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
          <TableSkeleton rows={10} />
        </>
      ) : (
        <CustomerTable customers={customers} />
      )}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Failed to load customers. Please try again.
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import UsersTable from "@/components/UsersTable";
import { useAdminUsers } from "@/hooks/useAdminData";

export default function UsersPage() {
  const { users, isLoading, isError } = useAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage admin users and system access</p>
        </div>
        <Link
          to="/admin/users/invite"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <span>📧</span>
          <span>Invite Admin</span>
        </Link>
      </div>

      {isLoading ? (
        <>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
          <TableSkeleton rows={8} />
        </>
      ) : (
        <UsersTable users={users} />
      )}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Failed to load users. Please try again.
        </div>
      )}
    </div>
  );
}

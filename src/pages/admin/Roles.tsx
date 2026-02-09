import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import AdminsTable from "@/components/AdminsTable";
import { useAdminUsers } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RolesPage() {
  const { users, isLoading, isError, refresh } = useAdminUsers();

  // Transform users to match AdminsTable interface
  const admins = users
    .filter(user => user.is_admin)
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      invited_by: user.invited_by,
      created_at: user.created_at,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin & Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage who has access to the Admin Panel and what they can do.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/roles/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Admin
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <AdminsTable admins={admins} onRefresh={refresh} />
      )}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load admin users. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

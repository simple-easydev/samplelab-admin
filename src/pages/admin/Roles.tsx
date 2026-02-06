import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import UsersTable from "@/components/UsersTable";
import { useAdminUsers } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RolesPage() {
  const { users, isLoading, isError } = useAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin & Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage admin users and role permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/roles/invite">
            <Mail className="mr-2 h-4 w-4" />
            Invite Admin
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <UsersTable users={users} />
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

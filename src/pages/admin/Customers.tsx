import { UserPlus } from "lucide-react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import CustomerTable from "@/components/CustomerTable";
import { useCustomers } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomersPage() {
  const { customers, isLoading, isError } = useCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all platform customers</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <CustomerTable customers={customers} />
      )}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load customers. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

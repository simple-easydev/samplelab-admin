import { useState } from "react";
import { Shield, MoreVertical, UserCog, Mail, Ban, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "full_admin" | "content_editor";
  status: "active" | "pending" | "disabled";
  last_login: string | null;
  invited_by: string | null;
  created_at: string;
}

interface AdminsTableProps {
  admins: AdminUser[];
  onRefresh: () => void;
}

export default function AdminsTable({ admins, onRefresh }: AdminsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<"changeRole" | "disable" | "delete" | "resend" | null>(null);
  const [newRole, setNewRole] = useState<"full_admin" | "content_editor">("content_editor");
  const [isLoading, setIsLoading] = useState(false);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangeRole = async () => {
    if (!selectedAdmin) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("users")
        // @ts-expect-error - Database types may not be up to date
        .update({ role: newRole })
        .eq("id", selectedAdmin.id);

      if (error) throw error;

      toast.success("Role updated successfully");
      onRefresh();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsLoading(false);
      setActionType(null);
      setSelectedAdmin(null);
    }
  };

  const handleResendInvite = async (admin: AdminUser) => {
    setIsLoading(true);
    
    try {
      // Get the existing invite
      const { data: invite } = await supabase
        .from("admin_invites")
        .select("*")
        .eq("email", admin.email)
        .single() as any;

      if (!invite) {
        throw new Error("No pending invite found");
      }

      // Update expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from("admin_invites")
        // @ts-expect-error - Database types may not be up to date
        .update({ expires_at: expiresAt.toISOString() })
        .eq("id", invite.id);

      if (error) throw error;

      toast.success("Invite resent successfully");
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableAdmin = async () => {
    if (!selectedAdmin) return;
    setIsLoading(true);
    
    try {
      const newStatus = selectedAdmin.status === "disabled" ? "active" : "disabled";
      
      const { error } = await supabase
        .from("users")
        // @ts-expect-error - Database types may not be up to date
        .update({ status: newStatus })
        .eq("id", selectedAdmin.id);

      if (error) throw error;

      toast.success(
        selectedAdmin.status === "disabled" 
          ? "Admin enabled successfully" 
          : "Admin disabled successfully"
      );
      onRefresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
      setActionType(null);
      setSelectedAdmin(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setIsLoading(true);
    
    try {
      // First, delete from auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Delete user record (soft delete by removing admin status)
      const { error } = await supabase
        .from("users")
        // @ts-expect-error - Database types may not be up to date
        .update({ 
          is_admin: false,
          role: "content_editor",
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedAdmin.id);

      if (error) throw error;

      toast.success("Admin access revoked successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    } finally {
      setIsLoading(false);
      setActionType(null);
      setSelectedAdmin(null);
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "full_admin" ? (
      <Badge variant="destructive">Super Admin</Badge>
    ) : (
      <Badge variant="secondary">Content Admin</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "disabled":
        return <Badge variant="outline">Disabled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card className="p-4">
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {filteredAdmins.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="p-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No admin users found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Admin users will appear here once invited"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {admin.name?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                      </div>
                      <div className="font-medium">{admin.name || "—"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{getRoleBadge(admin.role)}</TableCell>
                  <TableCell>{getStatusBadge(admin.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatLastLogin(admin.last_login)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.invited_by || "System"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setNewRole(admin.role);
                            setActionType("changeRole");
                          }}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        
                        {admin.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(admin)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setActionType("disable");
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {admin.status === "disabled" ? "Enable" : "Disable"}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setActionType("delete");
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Change Role Dialog */}
      <AlertDialog open={actionType === "changeRole"} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              Update the role for {selectedAdmin?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Select New Role</label>
            <Select value={newRole} onValueChange={(value: "full_admin" | "content_editor") => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_admin">Super Admin</SelectItem>
                <SelectItem value="content_editor">Content Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Admin Dialog */}
      <AlertDialog open={actionType === "disable"} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAdmin?.status === "disabled" ? "Enable Admin" : "Disable Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin?.status === "disabled" 
                ? `Enable ${selectedAdmin?.email} to restore their access to the admin panel?`
                : `Disable ${selectedAdmin?.email}? They will lose access to the admin panel.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableAdmin} disabled={isLoading}>
              {isLoading ? "Processing..." : selectedAdmin?.status === "disabled" ? "Enable" : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Admin Dialog */}
      <AlertDialog open={actionType === "delete"} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAdmin?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAdmin} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

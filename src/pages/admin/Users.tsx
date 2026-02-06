import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Ban,
  Check,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  subscription_status: "Trialing" | "Active" | "Canceled" | "None";
  plan_tier: string | null;
  credits_remaining: number;
  downloads_30d: number;
  last_active: string;
  is_active: boolean;
  created_at: string;
}

type SubscriptionFilter = "all" | "trialing" | "subscribed" | "canceled" | "never";
type StatusFilter = "all" | "active" | "disabled";
type SortOption = "newest" | "a-z" | "last-active";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [creditsMin, setCreditsMin] = useState("");
  const [creditsMax, setCreditsMax] = useState("");

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual customers table query
      // For now, using mock data structure
      const mockUsers: User[] = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          avatar_url: null,
          subscription_status: "Active",
          plan_tier: "Pro",
          credits_remaining: 150,
          downloads_30d: 45,
          last_active: new Date().toISOString(),
          is_active: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          avatar_url: null,
          subscription_status: "Trialing",
          plan_tier: "Starter",
          credits_remaining: 50,
          downloads_30d: 12,
          last_active: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Mike Johnson",
          email: "mike@example.com",
          avatar_url: null,
          subscription_status: "Canceled",
          plan_tier: null,
          credits_remaining: 5,
          downloads_30d: 2,
          last_active: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          name: "Sarah Williams",
          email: "sarah@example.com",
          avatar_url: null,
          subscription_status: "None",
          plan_tier: null,
          credits_remaining: 0,
          downloads_30d: 0,
          last_active: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: false,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setUsers(mockUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !user.name.toLowerCase().includes(query) &&
          !user.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Subscription status filter
      if (subscriptionFilter !== "all") {
        if (subscriptionFilter === "trialing" && user.subscription_status !== "Trialing")
          return false;
        if (
          subscriptionFilter === "subscribed" &&
          user.subscription_status !== "Active"
        )
          return false;
        if (
          subscriptionFilter === "canceled" &&
          user.subscription_status !== "Canceled"
        )
          return false;
        if (subscriptionFilter === "never" && user.subscription_status !== "None")
          return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !user.is_active) return false;
        if (statusFilter === "disabled" && user.is_active) return false;
      }

      // Credits range filter
      if (creditsMin && user.credits_remaining < parseInt(creditsMin)) return false;
      if (creditsMax && user.credits_remaining > parseInt(creditsMax)) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "last-active":
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Handle view user
  const handleViewUser = (user: User) => {
    navigate(`/admin/users/${user.id}`);
  };

  // Handle disable user
  const handleDisableUser = (user: User) => {
    setSelectedUser(user);
    setShowDisableDialog(true);
  };

  // Confirm disable user
  const confirmDisableUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);

      // TODO: Update actual database
      // For now, update local state
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, is_active: !u.is_active } : u
        )
      );

      toast.success(
        `User ${selectedUser.is_active ? "disabled" : "enabled"}`,
        {
          description: `${selectedUser.name} has been ${
            selectedUser.is_active ? "disabled" : "enabled"
          }.`,
        }
      );

      setShowDisableDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Error updating user status:", err);
      toast.error("Failed to update user: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get subscription status badge
  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "Trialing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Trialing</Badge>;
      case "Active":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "Canceled":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Canceled</Badge>;
      case "None":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">None</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer accounts and subscriptions
          </p>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4">
              {/* Subscription Status */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={subscriptionFilter}
                  onValueChange={(value) =>
                    setSubscriptionFilter(value as SubscriptionFilter)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscriptions</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="subscribed">Subscribed</SelectItem>
                    <SelectItem value="canceled">Canceled / Expired</SelectItem>
                    <SelectItem value="never">Never Subscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credits Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Credits:</span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={creditsMin}
                  onChange={(e) => setCreditsMin(e.target.value)}
                  className="w-20"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={creditsMax}
                  onChange={(e) => setCreditsMax(e.target.value)}
                  className="w-20"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="a-z">A → Z</SelectItem>
                    <SelectItem value="last-active">Last Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Users ({filteredAndSortedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load users: {error}</AlertDescription>
              </Alert>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Plan Tier</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Downloads (30d)</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>{getSubscriptionBadge(user.subscription_status)}</TableCell>
                      <TableCell>
                        {user.plan_tier ? (
                          <Badge variant="secondary">{user.plan_tier}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {user.credits_remaining}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {user.downloads_30d}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.last_active).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisableUser(user)}>
                              {user.is_active ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Enable User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disable/Enable User Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.is_active ? "Disable User?" : "Enable User?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {selectedUser?.is_active ? (
                  <>
                    <p>
                      This will disable <strong>"{selectedUser.name}"</strong>, preventing
                      them from accessing the platform.
                    </p>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Why "Disable User" can be useful:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>Fraud / Abuse / Chargebacks</li>
                          <li>Legal or DMCA issues</li>
                          <li>Support & troubleshooting</li>
                          <li>Billing issues</li>
                          <li>Internal early testers / QA accounts</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground">
                      Their subscription and data will remain intact. You can re-enable
                      them at any time.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This will enable <strong>"{selectedUser?.name}"</strong>, allowing
                      them to access the platform again.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedUser?.is_active ? (
                "Disable User"
              ) : (
                "Enable User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

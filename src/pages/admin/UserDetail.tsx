import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Calendar,
  CreditCard,
  Download,
  Activity,
  Shield,
  Ban,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Package,
  Music,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  login_method: "Email" | "Google" | "Apple";
  subscription_status: "Trialing" | "Active" | "Canceled" | "None";
  plan_tier: string | null;
  billing_cycle: "Monthly" | "Yearly" | null;
  next_billing_date: string | null;
  credits_remaining: number;
  monthly_allowance: number | null;
  rollover_credits: number;
  total_credits_spent: number;
  downloads_30d: number;
  total_downloads: number;
  last_active: string;
  is_active: boolean;
  created_at: string;
  trial_ends_at: string | null;
  trial_credits: number | null;
  subscription_started_at: string | null;
  subscription_canceled_at: string | null;
}

interface DownloadHistory {
  id: string;
  content_type: "Sample" | "Pack";
  name: string;
  creator: string;
  credits_spent: number;
  downloaded_at: string;
}

interface CreditAdjustment {
  id: string;
  amount: number;
  reason: string;
  adjusted_by: string;
  adjusted_at: string;
}

interface ActivityLog {
  id: string;
  action: "Logged in" | "Started trial" | "Subscription activated" | "Subscription canceled" | "Credits added (admin)" | "Download made" | "Plan changed";
  description: string;
  timestamp: string;
}

type DownloadFilter = "last-30-days" | "all-time";
type DownloadTypeFilter = "all" | "sample" | "pack";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [creditAdjustments, setCreditAdjustments] = useState<CreditAdjustment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showAdjustCreditsDialog, setShowAdjustCreditsDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showCancelSubscriptionDialog, setShowCancelSubscriptionDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Adjust credits form
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Change plan form
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  // Download filters
  const [downloadTimeFilter, setDownloadTimeFilter] = useState<DownloadFilter>("last-30-days");
  const [downloadTypeFilter, setDownloadTypeFilter] = useState<DownloadTypeFilter>("all");

  useEffect(() => {
    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual database query
      // Mock data for now
      const mockUser: UserDetail = {
        id: id || "1",
        name: "John Doe",
        email: "john@example.com",
        avatar_url: null,
        login_method: "Email",
        subscription_status: "Active",
        plan_tier: "Pro",
        billing_cycle: "Monthly",
        next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        credits_remaining: 150,
        monthly_allowance: 200,
        rollover_credits: 50,
        total_credits_spent: 350,
        downloads_30d: 45,
        total_downloads: 234,
        last_active: new Date().toISOString(),
        is_active: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
        trial_credits: null,
        subscription_started_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_canceled_at: null,
      };

      const mockDownloads: DownloadHistory[] = [
        {
          id: "1",
          content_type: "Sample",
          name: "Kick 808",
          creator: "Metro Sounds",
          credits_spent: 2,
          downloaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          content_type: "Pack",
          name: "Lo-Fi Dreams",
          creator: "Chill Beats Co.",
          credits_spent: 25,
          downloaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          content_type: "Sample",
          name: "Snare Roll",
          creator: "Trap Masters",
          credits_spent: 3,
          downloaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          content_type: "Pack",
          name: "Hip-Hop Essentials",
          creator: "Metro Sounds",
          credits_spent: 30,
          downloaded_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const mockAdjustments: CreditAdjustment[] = [
        {
          id: "1",
          amount: 50,
          reason: "Compensation for technical issue",
          adjusted_by: "Admin User",
          adjusted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const mockActivity: ActivityLog[] = [
        {
          id: "1",
          action: "Logged in",
          description: "Logged in from Chrome (Windows)",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          action: "Download made",
          description: "Downloaded 'Kick 808' (Sample, 2 credits)",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          action: "Credits added (admin)",
          description: "50 credits added by Admin User - Compensation for technical issue",
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          action: "Subscription activated",
          description: "Subscribed to Pro plan (Monthly)",
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "5",
          action: "Started trial",
          description: "Started 7-day free trial",
          timestamp: new Date(Date.now() - 67 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setUser(mockUser);
      setDownloadHistory(mockDownloads);
      setCreditAdjustments(mockAdjustments);
      setActivityLogs(mockActivity);
    } catch (err: any) {
      console.error("Error fetching user detail:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const handleDisableUser = () => {
    setShowDisableDialog(true);
  };

  const handleAdjustCredits = () => {
    setShowAdjustCreditsDialog(true);
    setAdjustmentAmount("");
    setAdjustmentReason("");
  };

  const handleChangePlan = () => {
    if (!user?.plan_tier) return;
    setSelectedPlan(user.plan_tier);
    setShowChangePlanDialog(true);
  };

  const confirmChangePlan = async () => {
    if (!user || !selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    if (selectedPlan === user.plan_tier) {
      toast.error("Please select a different plan");
      return;
    }

    try {
      setIsUpdating(true);

      // TODO: Backend calls Stripe API to update subscription
      // This would be an API call to your backend which then updates Stripe
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Update UI with new plan info
      const newMonthlyAllowance = 
        selectedPlan === "Starter" ? 100 : 
        selectedPlan === "Pro" ? 200 : 
        300; // Elite

      setUser({
        ...user,
        plan_tier: selectedPlan,
        monthly_allowance: newMonthlyAllowance,
        // Next billing date would come from Stripe response
      });

      toast.success("Plan updated successfully", {
        description: `Subscription changed to ${selectedPlan} plan.`,
      });

      setShowChangePlanDialog(false);
    } catch (err: any) {
      console.error("Error changing plan:", err);
      toast.error("Failed to change plan: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelSubscriptionDialog(true);
  };

  const confirmCancelSubscription = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // TODO: Backend calls Stripe API to cancel subscription at period end
      // This would be an API call to your backend which then calls Stripe
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Calculate the cancellation date (end of billing period)
      const cancellationDate = user.next_billing_date 
        ? new Date(user.next_billing_date)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update UI with canceled status
      setUser({
        ...user,
        subscription_status: "Canceled",
        subscription_canceled_at: cancellationDate.toISOString(),
      });

      toast.success("Subscription canceled", {
        description: `Access continues until ${cancellationDate.toLocaleDateString()}.`,
      });

      setShowCancelSubscriptionDialog(false);
    } catch (err: any) {
      console.error("Error canceling subscription:", err);
      toast.error("Failed to cancel subscription: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAdjustCredits = async () => {
    if (!user || !adjustmentAmount || !adjustmentReason) {
      toast.error("Please fill in all fields");
      return;
    }

    // Parse the amount - it can be +50, -20, or just 50
    let amount = parseInt(adjustmentAmount.replace(/\s/g, ""));
    
    if (isNaN(amount) || amount === 0) {
      toast.error("Please enter a valid amount (e.g., +50 or -20)");
      return;
    }

    try {
      setIsUpdating(true);

      // TODO: Update actual database
      const newBalance = user.credits_remaining + amount;
      
      if (newBalance < 0) {
        toast.error("Cannot adjust credits below 0");
        setIsUpdating(false);
        return;
      }

      setUser({
        ...user,
        credits_remaining: newBalance,
      });

      toast.success(`Credits ${amount > 0 ? "added" : "removed"}`, {
        description: `${Math.abs(amount)} credits ${amount > 0 ? "added to" : "removed from"} ${user.name}'s account.`,
      });

      setShowAdjustCreditsDialog(false);
      setAdjustmentAmount("");
      setAdjustmentReason("");
    } catch (err: any) {
      console.error("Error adjusting credits:", err);
      toast.error("Failed to adjust credits: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter downloads based on filters
  const filteredDownloads = downloadHistory.filter((download) => {
    // Time filter
    if (downloadTimeFilter === "last-30-days") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(download.downloaded_at) < thirtyDaysAgo) {
        return false;
      }
    }

    // Type filter
    if (downloadTypeFilter !== "all") {
      if (downloadTypeFilter === "sample" && download.content_type !== "Sample") {
        return false;
      }
      if (downloadTypeFilter === "pack" && download.content_type !== "Pack") {
        return false;
      }
    }

    return true;
  });

  const confirmDisableUser = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // TODO: Update actual database
      setUser({ ...user, is_active: !user.is_active });

      toast.success(
        `User ${user.is_active ? "disabled" : "enabled"}`,
        {
          description: `${user.name} has been ${user.is_active ? "disabled" : "enabled"}.`,
        }
      );

      setShowDisableDialog(false);
    } catch (err: any) {
      console.error("Error updating user status:", err);
      toast.error("Failed to update user: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "User not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/users")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Details</h1>
              <p className="text-muted-foreground mt-1">
                View and manage user account information
              </p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                User Information
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDisableUser}>
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Active</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(user.last_active).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Login Method</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{user.login_method}</p>
                    </div>
                  </div>
                </div>

                {user.login_method !== "Email" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      SSO user - Cannot change password in-app
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Overview - Only show if subscribed, trialing, or canceled */}
        {(user.subscription_status === "Active" || user.subscription_status === "Trialing" || user.subscription_status === "Canceled") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Subscription Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Plan</span>
                    <Badge variant="secondary" className="text-base">
                      {user.plan_tier}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Billing Cycle</span>
                    <span className="font-medium">{user.billing_cycle}</span>
                  </div>
                  {user.next_billing_date && !user.subscription_canceled_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next Billing Date</span>
                      <span className="font-medium">
                        {new Date(user.next_billing_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {user.subscription_canceled_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cancels On</span>
                      <span className="font-medium text-orange-600">
                        {new Date(user.subscription_canceled_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getSubscriptionBadge(user.subscription_status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Credits</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Remaining</span>
                        <span className="text-xl font-bold text-primary">
                          {user.credits_remaining}
                        </span>
                      </div>
                      {user.monthly_allowance && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Monthly Allowance</span>
                          <span className="font-medium">{user.monthly_allowance}</span>
                        </div>
                      )}
                      {user.rollover_credits > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Rollover Credits</span>
                          <span className="font-medium text-green-600">
                            +{user.rollover_credits}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {creditAdjustments.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Manual Adjustments</p>
                      <div className="space-y-2 text-sm">
                        {creditAdjustments.map((adj) => (
                          <div key={adj.id} className="flex items-start gap-2">
                            <span className={adj.amount > 0 ? "text-green-600" : "text-red-600"}>
                              {adj.amount > 0 ? "+" : ""}{adj.amount}
                            </span>
                            <span className="text-muted-foreground flex-1">{adj.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAdjustCredits}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Adjust Credits
                </Button>
                {user.subscription_status !== "Canceled" && (
                  <>
                    <Button variant="outline" onClick={handleChangePlan}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                    <Button variant="destructive" onClick={handleCancelSubscription}>
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Info - Only show if trialing */}
        {user.subscription_status === "Trialing" && user.trial_ends_at && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Clock className="h-5 w-5" />
                Trial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial End Date</span>
                  <span className="font-medium">
                    {new Date(user.trial_ends_at).toLocaleDateString()}
                  </span>
                </div>
                {user.trial_credits !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trial Credits Available</span>
                    <span className="font-medium">{user.trial_credits}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Downloads (30d)</p>
                <p className="text-3xl font-bold text-primary">{user.downloads_30d}</p>
                <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Total Downloads</p>
                <p className="text-3xl font-bold">{user.total_downloads}</p>
                <p className="text-xs text-muted-foreground mt-1">All-time value</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Credits Spent</p>
                <p className="text-3xl font-bold">{user.total_credits_spent}</p>
                <p className="text-xs text-muted-foreground mt-1">All-time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download History
                </CardTitle>
                <CardDescription>
                  Track user's downloads and credit spending
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={downloadTimeFilter} onValueChange={(value) => setDownloadTimeFilter(value as DownloadFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={downloadTypeFilter} onValueChange={(value) => setDownloadTypeFilter(value as DownloadTypeFilter)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sample">Samples</SelectItem>
                    <SelectItem value="pack">Packs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDownloads.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No downloads found for the selected filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Credits Spent</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDownloads.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.content_type === "Pack" ? (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Music className="h-4 w-4 text-muted-foreground" />
                          )}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.creator}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.credits_spent}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.downloaded_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Log
            </CardTitle>
            <CardDescription>
              Comprehensive timeline of user actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No activity logs yet.
              </p>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelSubscriptionDialog} onOpenChange={setShowCancelSubscriptionDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  User will retain access until the end of the current billing period.
                  Credits remain usable until then.
                </p>

                {user?.next_billing_date && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Access will continue until{" "}
                      <strong>{new Date(user.next_billing_date).toLocaleDateString()}</strong>.
                      Subscription will be canceled at that time.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700">
                  <AlertDescription className="text-sm">
                    Cancellation does not delete the user or wipe downloads; it only stops
                    future billing and disables new credit renewals after period end.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              disabled={isUpdating}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Update the user's subscription plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Short note:</strong> "Stripe will handle prorated charges
                automatically."
              </AlertDescription>
            </Alert>

            {selectedPlan && user && selectedPlan !== user.plan_tier && (
              <Alert>
                <AlertDescription>
                  User will be moved from <strong>{user.plan_tier}</strong> to{" "}
                  <strong>{selectedPlan}</strong> plan.
                </AlertDescription>
              </Alert>
            )}

            {/* Yellow warning box */}
            <Alert className="bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700">
              <AlertDescription className="text-sm">
                <strong>Change Plan</strong> = admin-initiated (but change). Billing +
                credits are updated via Stripe webhooks.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangePlanDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={confirmChangePlan} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Credits Dialog */}
      <Dialog open={showAdjustCreditsDialog} onOpenChange={setShowAdjustCreditsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Add or remove credits from this user's account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Input: +10 / -10 (or any number)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="e.g., +50 or -20"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                Use + for adding credits, - for removing credits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (text field)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Compensation for technical issue, Refund, Support request"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                disabled={isUpdating}
              />
            </div>

            {/* Yellow warning box */}
            <Alert className="bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700">
              <AlertDescription className="text-sm space-y-2">
                <p>
                  <strong>Adjust Credits</strong> = admin-only manual credit changes (no
                  billing). Use for support, test accounts, and comped users.
                </p>
                <p className="font-semibold">Only changes the in-app credit balance.</p>
              </AlertDescription>
            </Alert>

            {user && adjustmentAmount && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  User will have{" "}
                  <strong>
                    {user.credits_remaining + parseInt(adjustmentAmount || "0")}
                  </strong>{" "}
                  credits after this adjustment.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustCreditsDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={confirmAdjustCredits} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable/Enable User Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_active ? "Disable User?" : "Enable User?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {user.is_active ? (
                  <>
                    <p>
                      This will disable <strong>"{user.name}"</strong>, preventing
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
                      This will enable <strong>"{user.name}"</strong>, allowing
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
              ) : user.is_active ? (
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

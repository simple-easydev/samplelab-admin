import { Link } from "react-router-dom";
import { Suspense } from "react";
import { Shield, Users, Star, Music, Download, Upload, UserPlus } from "lucide-react";
import { StatsCardSkeleton } from "@/components/LoadingSkeleton";
import { useAdminStats } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function DashboardStats() {
  const { stats, isLoading, isError } = useAdminStats();
  if (isLoading || isError || !stats) {
    return (
      <>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </>
    );
  }
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_users ?? 0}</div>
          <p className="text-xs text-muted-foreground">System access</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_customers ?? 0}</div>
          <p className="text-xs text-green-600">↑ Active accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active_subscriptions ?? 0}</div>
          <p className="text-xs text-green-600">↑ Paid members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Samples</CardTitle>
          <Music className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_samples ?? 0}</div>
          <p className="text-xs text-blue-600">In library</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          <Download className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_downloads ?? 0}</div>
          <p className="text-xs text-purple-600">All time</p>
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your SampleLab platform from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Suspense
          fallback={
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          }
        >
          <DashboardStats />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link to="/admin/samples">
                <Upload className="mr-2 h-4 w-4" />
                Upload Samples
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/customers">
                <Users className="mr-2 h-4 w-4" />
                View All Customers
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/users">
                <UserPlus className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Activity feed coming soon...</p>
            <p className="text-sm mt-2">This will show recent user actions, downloads, and system events.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

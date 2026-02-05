import { Suspense } from "react";
import Link from "next/link";
import { StatsCardSkeleton } from "@/components/LoadingSkeleton";
import { createServerClient } from "@/lib/supabase-server";
import type { AdminStats } from "@/types";

// Force dynamic rendering for server components that use cookies
export const dynamic = 'force-dynamic';

// Server Component - fetches data directly
async function DashboardStats() {
  const supabase = await createServerClient();
  
  // Fetch stats directly on the server
  const { data: stats } = await supabase
    .from("users")
    .select("id")
    .then(async (usersResult) => {
      const { data: customersResult } = await supabase
        .from("customers")
        .select("id, subscription_tier");
      
      const totalUsers = usersResult.data?.length || 0;
      const totalCustomers = customersResult?.length || 0;
      const activeSubscriptions = customersResult?.filter(
        (c) => c.subscription_tier && c.subscription_tier !== "free"
      ).length || 0;

      return {
        data: {
          total_users: totalUsers,
          total_customers: totalCustomers,
          active_subscriptions: activeSubscriptions,
          total_samples: 0,
        } as AdminStats,
      };
    });

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Admin Users</h3>
          <span className="text-2xl">🔐</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</p>
        <p className="text-sm text-gray-500 mt-2">System access</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Customers</h3>
          <span className="text-2xl">👥</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats?.total_customers || 0}</p>
        <p className="text-sm text-green-600 mt-2">↑ Active accounts</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Subscriptions</h3>
          <span className="text-2xl">⭐</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats?.active_subscriptions || 0}</p>
        <p className="text-sm text-green-600 mt-2">↑ Paid members</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Samples</h3>
          <span className="text-2xl">🎵</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats?.total_samples || 0}</p>
        <p className="text-sm text-blue-600 mt-2">In library</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Downloads</h3>
          <span className="text-2xl">📥</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">0</p>
        <p className="text-sm text-purple-600 mt-2">All time</p>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your SampleLab platform from here.
        </p>
      </div>

      {/* Stats Cards with Suspense */}
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/samples"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>📤</span>
            <span>Upload Samples</span>
          </Link>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>👥</span>
            <span>View All Customers</span>
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>🔐</span>
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Activity feed coming soon...</p>
          <p className="text-sm mt-2">
            This will show recent user actions, downloads, and system events.
          </p>
        </div>
      </div>
    </div>
  );
}

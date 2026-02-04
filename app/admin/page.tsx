import Link from "next/link";

async function getAdminStats() {
  try {
    // Use relative URL for API route - works in both dev and production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/admin/stats`,
      {
        cache: "no-store",
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      total_users: 0,
      active_subscriptions: 0,
      total_samples: 0,
      total_downloads: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Admin Users</h3>
            <span className="text-2xl">🔐</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
          <p className="text-sm text-gray-500 mt-2">System access</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Customers</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_customers}</p>
          <p className="text-sm text-green-600 mt-2">↑ Active accounts</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Subscriptions</h3>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.active_subscriptions}</p>
          <p className="text-sm text-green-600 mt-2">↑ Paid members</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Samples</h3>
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_samples}</p>
          <p className="text-sm text-blue-600 mt-2">In library</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Downloads</h3>
            <span className="text-2xl">📥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_downloads}</p>
          <p className="text-sm text-purple-600 mt-2">All time</p>
        </div>
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

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Platform insights and metrics
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Dashboard Coming Soon
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Advanced analytics and reporting features will be available in future updates.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
            <span>🚧</span>
            <span className="text-sm font-medium">Under Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}

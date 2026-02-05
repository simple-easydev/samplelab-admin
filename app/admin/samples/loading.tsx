export default function SamplesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-4 px-1 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 animate-pulse">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

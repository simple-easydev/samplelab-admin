import { StatsCardSkeleton } from "@/components/LoadingSkeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-12 bg-gray-200 rounded w-40"></div>
          <div className="h-12 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    </div>
  );
}

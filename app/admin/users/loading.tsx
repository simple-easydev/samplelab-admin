import { TableSkeleton } from "@/components/LoadingSkeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>

      <TableSkeleton rows={8} />
    </div>
  );
}

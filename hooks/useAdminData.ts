// Custom hooks for fetching admin data with SWR

import useSWR from "swr";
import type { User, Customer, AdminStats } from "@/types";

// Hook for fetching admin statistics with aggressive caching
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(
    "/api/admin/stats",
    {
      // Stats are less critical, cache for 5 minutes
      dedupingInterval: 300000,
      revalidateOnMount: true,
      keepPreviousData: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate, // Manual refresh function
  };
}

// Hook for fetching admin users with optimized caching
export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<{ users: User[] }>(
    "/api/admin/users",
    {
      // User list changes less frequently
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
      // Fetch on mount but use cache if available
      revalidateOnMount: true,
    }
  );

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching customers with optimized caching
export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR<{ customers: Customer[] }>(
    "/api/admin/customers",
    {
      // Customer list changes less frequently
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
      // Fetch on mount but use cache if available
      revalidateOnMount: true,
    }
  );

  return {
    customers: data?.customers || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Generic hook for any API endpoint
export function useAPI<T>(url: string | null) {
  const { data, error, isLoading, mutate } = useSWR<T>(url);

  return {
    data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

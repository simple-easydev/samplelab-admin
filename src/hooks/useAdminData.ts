import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import type { User, Customer, AdminStats } from "@/types";

async function fetchAdminStats(): Promise<AdminStats> {
  const [
    { count: totalUsers },
    { count: totalCustomers },
    { count: activeSubscriptions },
    { count: totalSamples },
    { data: downloadStats },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("samples").select("*", { count: "exact", head: true }),
    supabase.from("samples").select("download_count"),
  ]);

  const totalDownloads = (downloadStats || []).reduce(
    (sum, s: { download_count?: number }) => sum + (s.download_count || 0),
    0
  );

  return {
    total_users: totalUsers ?? 0,
    total_customers: totalCustomers ?? 0,
    active_subscriptions: activeSubscriptions ?? 0,
    total_samples: totalSamples ?? 0,
    total_downloads: totalDownloads,
  };
}

async function fetchAdminUsers(): Promise<{ users: User[] }> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { users: data ?? [] };
}

async function fetchCustomers(): Promise<{ customers: Customer[] }> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { customers: data ?? [] };
}

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(
    "admin-stats",
    fetchAdminStats,
    {
      dedupingInterval: 300000,
      revalidateOnMount: true,
      keepPreviousData: true,
    }
  );
  return { stats: data, isLoading, isError: error, refresh: mutate };
}

export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<{ users: User[] }>(
    "admin-users",
    fetchAdminUsers,
    {
      dedupingInterval: 60000,
      keepPreviousData: true,
      revalidateOnMount: true,
    }
  );
  return { users: data?.users ?? [], isLoading, isError: error, refresh: mutate };
}

export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR<{ customers: Customer[] }>(
    "admin-customers",
    fetchCustomers,
    {
      dedupingInterval: 60000,
      keepPreviousData: true,
      revalidateOnMount: true,
    }
  );
  return { customers: data?.customers ?? [], isLoading, isError: error, refresh: mutate };
}

export function useAPI<T>(key: string | null, fetcher: () => Promise<T>) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    key ? (_k: string) => fetcher() : null
  );
  return { data, isLoading, isError: error, refresh: mutate };
}

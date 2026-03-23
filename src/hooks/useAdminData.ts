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
  // Fetch existing admin users with their inviter info
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*, inviter:invited_by(email, name)")
    .eq("is_admin", true)
    .order("created_at", { ascending: false });
  
  if (usersError) throw usersError;

  // Fetch pending invites
  const { data: invites, error: invitesError } = await supabase
    .from("admin_invites")
    .select("*, inviter:invited_by(email, name)")
    .eq("used", false)
    .order("created_at", { ascending: false });

  if (invitesError) throw invitesError;

  // Format existing users
  const formattedUsers: User[] = (users || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url ?? null,
    is_admin: user.is_admin,
    role: user.role as "full_admin" | "content_editor",
    status: user.status || "active" as "active" | "pending" | "disabled",
    last_login: user.last_login,
    invited_by: user.inviter?.name || user.inviter?.email || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));

  // Convert pending invites to User format with "pending" status
  const pendingUsers: User[] = (invites || []).map((invite: any) => ({
    id: invite.id, // Temporary ID until user is created
    email: invite.email,
    name: null,
    avatar_url: null,
    is_admin: true,
    role: invite.role as "full_admin" | "content_editor",
    status: "pending" as const,
    last_login: null,
    invited_by: invite.inviter?.name || invite.inviter?.email || null,
    created_at: invite.created_at,
    updated_at: invite.created_at,
  }));

  // Combine and return
  return { users: [...formattedUsers, ...pendingUsers] };
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

/** Shape returned by get_all_samples RPC (one row per sample). */
export interface AdminSampleRow {
  id: string;
  name: string;
  preview_audio_url?: string | null;
  pack_id: string;
  pack_name: string;
  creator_name: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  type: string;
  download_count: number;
  credit_cost: number | null;
  status: string;
  has_stems: boolean;
  stems_count: number;
  created_at: string;
  thumbnail_url: string | null;
}

/** Sample shape for SamplesTab (pack as object, camelCase). */
export interface AdminSample {
  id: string;
  name: string;
  pack: { id: string; name: string };
  creator: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  type: "Loop" | "One-shot";
  downloads: number;
  creditCost: number | null;
  status: "Active" | "Disabled";
  hasStems: boolean;
  stemsCount?: number;
  createdAt: string;
  thumbnailUrl: string | null;
  previewAudioUrl?: string | null;
}

async function fetchAllSamplesForAdmin(): Promise<AdminSample[]> {
  const { data, error } = await supabase.rpc("get_all_samples");
  if (error) throw error;
  const rows = (data ?? []) as AdminSampleRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    pack: { id: row.pack_id, name: row.pack_name },
    creator: row.creator_name,
    genre: row.genre,
    bpm: row.bpm,
    key: row.key,
    type: row.type as "Loop" | "One-shot",
    downloads: row.download_count,
    creditCost: row.credit_cost,
    status: row.status as "Active" | "Disabled",
    hasStems: row.has_stems,
    stemsCount: row.stems_count,
    createdAt: row.created_at,
    thumbnailUrl: row.thumbnail_url,
    previewAudioUrl: row.preview_audio_url ?? null,
  }));
}

export function useAllSamples() {
  const { data, error, isLoading, mutate } = useSWR<AdminSample[]>(
    "admin-all-samples",
    fetchAllSamplesForAdmin,
    {
      dedupingInterval: 60000,
      keepPreviousData: true,
      revalidateOnMount: true,
    }
  );
  return { samples: data ?? [], isLoading, isError: error, refresh: mutate };
}

export function useAPI<T>(key: string | null, fetcher: () => Promise<T>) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    key ? (_k: string) => fetcher() : null
  );
  return { data, isLoading, isError: error, refresh: mutate };
}

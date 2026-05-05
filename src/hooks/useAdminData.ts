import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import type {
  User,
  Customer,
  AdminStats,
  AdminDashboardDetail,
} from "@/types";
import {
  fetchCreditRulesFromSettings,
  getCreditCostForSampleType,
} from "@/lib/credit-rules";

function isoThirtyDaysAgo(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString();
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  // Keep labels consistent with UTC bucketing (dayKeyUtc).
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function dayKeyUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

async function fetchAdminDashboardDetail(): Promise<AdminDashboardDetail> {
  const since30d = isoThirtyDaysAgo();

  const [
    { data: trendingRows, error: samplesError },
    { data: packRows, error: packsError },
    { data: topCreatorsRpc, error: creatorsError },
    { data: downloadRows, error: dlError },
  ] = await Promise.all([
    supabase.rpc("get_trending_samples" as any),
    supabase
      .from("packs")
      .select("name, download_count, creators(name)")
      .eq("status", "Published")
      .order("download_count", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase.rpc("get_top_creators" as any),
    supabase
      .from("credit_activity")
      .select("created_at")
      .eq("activity_type", "download_charge")
      .gte("created_at", since30d),
  ]);

  if (samplesError) throw samplesError;
  if (packsError) throw packsError;
  if (creatorsError) throw creatorsError;
  if (dlError) throw dlError;

  const top_samples = ((trendingRows ?? []) as { name?: string; creator_name?: string; download_count?: number }[])
    .slice(0, 5)
    .map((r) => ({
    name: r.name ?? "—",
    creator: r.creator_name ?? "—",
    downloads: r.download_count ?? 0,
  }));

  const top_packs = (packRows ?? []).map((r: any) => ({
    name: r.name ?? "—",
    creator: r.creators?.name ?? "—",
    downloads: r.download_count ?? 0,
  }));

  const top_creators = ((topCreatorsRpc ?? []) as any[]).slice(0, 5).map((c) => ({
    name: c.name ?? "—",
    samples: c.samples_count ?? 0,
    packs: c.packs_count ?? 0,
    rank: c.rank ?? 0,
  }));

  // Bucket download charges by UTC day for the last 30 days
  const byDay = new Map<string, number>();
  for (const row of downloadRows ?? []) {
    const k = dayKeyUtc((row as { created_at: string }).created_at);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }

  const download_trend: { day: string; downloads: number }[] = [];
  const end = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate() - i,
        12,
        0,
        0,
        0
      )
    );
    const k = dayKeyUtc(d.toISOString());
    download_trend.push({
      day: formatDayLabel(d.toISOString()),
      downloads: byDay.get(k) ?? 0,
    });
  }

  return { top_samples, top_packs, top_creators, download_trend };
}

async function fetchAdminStats(): Promise<AdminStats> {
  const since30d = isoThirtyDaysAgo();

  const [
    { count: totalUsers },
    { count: totalCustomers },
    { count: activeSubscriptions },
    { count: activeTrialingSubscriptions },
    { count: totalPacks },
    { count: totalSamples },
    { count: totalCreators },
    { data: downloadStats },
    { count: downloadsLast30d },
    { count: newUsersLast30d },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "trialing"),
    supabase.from("packs").select("*", { count: "exact", head: true }),
    supabase.from("samples").select("*", { count: "exact", head: true }),
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase.from("samples").select("download_count"),
    supabase
      .from("credit_activity")
      .select("*", { count: "exact", head: true })
      .eq("activity_type", "download_charge")
      .gte("created_at", since30d),
    // "New users" in the product = new customers created by the signup trigger.
    supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", since30d),
  ]);

  const totalDownloads = (downloadStats || []).reduce(
    (sum, s: { download_count?: number }) => sum + (s.download_count || 0),
    0
  );

  return {
    total_users: totalUsers ?? 0,
    total_customers: totalCustomers ?? 0,
    active_subscriptions: activeSubscriptions ?? 0,
    active_trialing_subscriptions: activeTrialingSubscriptions ?? 0,
    total_packs: totalPacks ?? 0,
    total_samples: totalSamples ?? 0,
    total_creators: totalCreators ?? 0,
    total_downloads: totalDownloads,
    downloads_last_30d: downloadsLast30d ?? 0,
    new_users_last_30d: newUsersLast30d ?? 0,
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

export function useAdminDashboardDetail() {
  const { data, error, isLoading, mutate } = useSWR<AdminDashboardDetail>(
    "admin-dashboard-detail",
    fetchAdminDashboardDetail,
    {
      dedupingInterval: 120000,
      revalidateOnMount: true,
      keepPreviousData: true,
    }
  );
  return { detail: data, isLoading, isError: error, refresh: mutate };
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
  creator_id: string | null;
  creator_name: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  instrument: string | null;
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
  creatorId: string | null;
  creator: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  instrument: string | null;
  type: "Loop" | "One-shot";
  downloads: number;
  creditCost: number;
  status: "Active" | "Disabled";
  hasStems: boolean;
  stemsCount?: number;
  createdAt: string;
  thumbnailUrl: string | null;
  previewAudioUrl?: string | null;
}

async function fetchAllSamplesForAdmin(): Promise<AdminSample[]> {
  const [rpcResult, creditRules] = await Promise.all([
    supabase.rpc("get_all_samples"),
    fetchCreditRulesFromSettings(),
  ]);
  const { data, error } = rpcResult;
  if (error) throw error;
  const rows = (data ?? []) as unknown as AdminSampleRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    pack: { id: row.pack_id, name: row.pack_name },
    creatorId: row.creator_id ?? null,
    creator: row.creator_name,
    genre: row.genre,
    bpm: row.bpm,
    key: row.key,
    instrument: row.instrument ?? null,
    type: row.type as "Loop" | "One-shot",
    downloads: row.download_count,
    creditCost: getCreditCostForSampleType(row.type, creditRules),
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

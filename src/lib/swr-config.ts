import { supabase } from "./supabase";

export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  refreshInterval: 0,
  shouldRetryOnError: true,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
  keepPreviousData: true,
  revalidateIfStale: true,
  compare: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
};

export const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { credentials: "include", headers });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as Error & { info?: unknown; status?: number }).info = await response.json().catch(() => ({}));
    (error as Error & { info?: unknown; status?: number }).status = response.status;
    throw error;
  }
  return response.json();
};

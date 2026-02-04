import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single<{ is_admin: boolean }>();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch stats
    const [
      { count: totalUsers },
      { count: totalCustomers },
      { count: activeSubscriptions },
      { count: totalSamples },
      { data: downloadStats },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("samples").select("*", { count: "exact", head: true }),
      supabase.from("samples").select("download_count"),
    ]);

    const totalDownloads = (downloadStats as Array<{ download_count: number }> | null)?.reduce(
      (sum, sample) => sum + (sample.download_count || 0),
      0
    ) || 0;

    return NextResponse.json({
      total_users: totalUsers || 0,
      total_customers: totalCustomers || 0,
      active_subscriptions: activeSubscriptions || 0,
      total_samples: totalSamples || 0,
      total_downloads: totalDownloads,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

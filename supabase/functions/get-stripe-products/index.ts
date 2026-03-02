// Supabase Edge Function: Get Plans (public)
// Fetches all active plans from plan_tiers for pricing/checkout. No auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface PlanTierPublic {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  billing_cycle: string;
  price: number;
  original_price: number | null;
  credits_monthly: number;
  is_popular: boolean;
  visible_onboarding: boolean;
  features: string[];
  sort_order: number;
  stripe_price_id: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const url = new URL(req.url);
    const visibleOnboardingParam = url.searchParams.get("visible_onboarding");
    const filterVisibleOnboarding =
      visibleOnboardingParam === "true" || visibleOnboardingParam === "1";

    let query = supabase
      .from("plan_tiers")
      .select(
        "id, name, display_name, description, billing_cycle, price, original_price, credits_monthly, is_popular, is_active, visible_onboarding, features, sort_order, stripe_price_id"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (filterVisibleOnboarding) {
      query = query.eq("visible_onboarding", true);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("get-stripe-products plan_tiers error:", error);
      return jsonResponse(
        { error: error.message || "Failed to fetch plans" },
        500
      );
    }

    const plans: PlanTierPublic[] = (rows ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      display_name: String(row.display_name),
      description: row.description != null ? String(row.description) : null,
      billing_cycle: String(row.billing_cycle ?? "month"),
      price: Number(row.price ?? 0),
      original_price:
        row.original_price != null ? Number(row.original_price) : null,
      credits_monthly: Number(row.credits_monthly ?? 0),
      is_popular: Boolean(row.is_popular),
      visible_onboarding: Boolean(row.visible_onboarding),
      features: Array.isArray(row.features) ? (row.features as string[]) : [],
      sort_order: Number(row.sort_order ?? 0),
      stripe_price_id:
        row.stripe_price_id != null ? String(row.stripe_price_id) : null,
    }));

    return jsonResponse(
      {
        success: true,
        plans,
        count: plans.length,
      },
      200
    );
  } catch (err) {
    console.error("get-stripe-products error:", err);
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      500
    );
  }
});

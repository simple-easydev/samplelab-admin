// Supabase Edge Function: Update Plan Tier
// Updates an existing plan in public.plan_tiers (admin only).
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UpdateBody = {
  id?: string;
  name?: string;
  display_name?: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  credits_monthly?: number;
  is_popular?: boolean;
  is_active?: boolean;
  features?: string[];
  sort_order?: number;
  stripe_price_id_monthly?: string | null;
  stripe_price_id_yearly?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST" && req.method !== "PATCH") {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      const message =
        authError?.message?.toLowerCase().includes("jwt") || authError?.message?.toLowerCase().includes("token")
          ? "Invalid or expired session. Please sign in again."
          : "Unauthorized";
      return jsonResponse({ error: message }, 401);
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("is_admin", true)
      .maybeSingle();

    if (!adminUser) {
      return jsonResponse({ error: "Forbidden: admin only" }, 403);
    }

    let body: UpdateBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const id = body.id?.trim();
    if (!id || !UUID_REGEX.test(id)) {
      return jsonResponse({ error: "Missing or invalid plan id" }, 400);
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.name = body.name.trim().toLowerCase().replace(/\s+/g, "_");
    }
    if (body.display_name !== undefined) {
      updates.display_name = body.display_name.trim();
    }
    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }
    if (body.price_monthly !== undefined) {
      updates.price_monthly = Number(body.price_monthly) || 0;
    }
    if (body.price_yearly !== undefined) {
      updates.price_yearly = Number(body.price_yearly) || 0;
    }
    if (body.credits_monthly !== undefined) {
      updates.credits_monthly = Math.floor(Number(body.credits_monthly) || 0);
    }
    if (body.is_popular !== undefined) {
      updates.is_popular = Boolean(body.is_popular);
    }
    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }
    if (body.features !== undefined) {
      updates.features = Array.isArray(body.features)
        ? body.features.filter((f): f is string => typeof f === "string")
        : [];
    }
    if (body.sort_order !== undefined) {
      updates.sort_order = Math.floor(Number(body.sort_order) || 0);
    }
    if (body.stripe_price_id_monthly !== undefined) {
      updates.stripe_price_id_monthly = body.stripe_price_id_monthly?.trim() || null;
    }
    if (body.stripe_price_id_yearly !== undefined) {
      updates.stripe_price_id_yearly = body.stripe_price_id_yearly?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No fields to update" }, 400);
    }

    const { data: plan, error: updateError } = await supabase
      .from("plan_tiers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update plan_tiers error:", updateError);
      if (updateError.code === "23505") {
        return jsonResponse(
          { error: "A plan with this name already exists" },
          409
        );
      }
      if (updateError.code === "PGRST116") {
        return jsonResponse({ error: "Plan not found" }, 404);
      }
      return jsonResponse(
        { error: updateError.message || "Failed to update plan" },
        500
      );
    }

    if (!plan) {
      return jsonResponse({ error: "Plan not found" }, 404);
    }

    return jsonResponse({ success: true, plan }, 200);
  } catch (err) {
    console.error("update-plan-tier error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

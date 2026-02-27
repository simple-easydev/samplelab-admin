// Supabase Edge Function: Delete Plan Tier
// Deletes a plan from public.plan_tiers and archives the linked Stripe product (admin only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";

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

type DeleteBody = {
  id?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST" && req.method !== "DELETE") {
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
        authError?.message?.toLowerCase().includes("jwt") ||
        authError?.message?.toLowerCase().includes("token")
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

    let body: DeleteBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const id = body.id?.trim();
    if (!id || !UUID_REGEX.test(id)) {
      return jsonResponse({ error: "Missing or invalid plan id" }, 400);
    }

    console.log("plan id to delete:", id);

    // Fetch plan to get Stripe price IDs before delete (for archiving product)
    const { data: plan, error: fetchError } = await supabase
      .from("plan_tiers")
      .select("id, stripe_price_id")
      .eq("id", id)
      .single();

    if (fetchError || !plan) {
      return jsonResponse({ error: "Plan not found" }, 404);
    }

    const priceId = (plan.stripe_price_id as string)?.trim();

    if (priceId) {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        try {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2026-01-28.clover",
          });
          const price = await stripe.prices.retrieve(priceId);
          const productId =
            typeof price.product === "string" ? price.product : price.product?.id;
          if (productId) {
            await stripe.products.update(productId, { active: false });
          }
        } catch (stripeErr) {
          console.error("Stripe archive product error:", stripeErr);
          // Continue with DB delete; Stripe archive is best-effort
        }
      }
    }

    const { error: deleteError } = await supabase
      .from("plan_tiers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete plan_tiers error:", deleteError);
      return jsonResponse(
        { error: deleteError.message || "Failed to delete plan" },
        500
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("delete-plan-tier error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

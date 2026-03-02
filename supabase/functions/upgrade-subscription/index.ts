// Supabase Edge Function: Upgrade Subscription
// Changes the current subscription to a new plan (price). Stripe prorates the change.
// Example: Pro -> Elite. User is charged the prorated difference; webhook updates DB.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Missing STRIPE_SECRET_KEY");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: { priceId?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const newPriceId = typeof body.priceId === "string" ? body.priceId.trim() : "";
    if (!newPriceId) {
      return jsonResponse({ error: "Missing or invalid priceId" }, 400);
    }

    // Optional: ensure the new price is an active plan in plan_tiers
    const { data: planRow } = await supabase
      .from("plan_tiers")
      .select("id, name, display_name")
      .eq("stripe_price_id", newPriceId)
      .eq("is_active", true)
      .maybeSingle();

    if (!planRow) {
      return jsonResponse(
        { error: "Invalid plan or price: not found in active plans" },
        400
      );
    }

    // Get customer linked to this user
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError || !customer) {
      return jsonResponse({ error: "Customer not found" }, 404);
    }

    // Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, stripe_price_id")
      .eq("customer_id", customer.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup error:", subError);
      return jsonResponse({ error: "Failed to find subscription" }, 500);
    }

    if (!subscription) {
      return jsonResponse(
        { error: "No active subscription found. Subscribe to a plan first." },
        404
      );
    }

    const stripeSubscriptionId = subscription.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return jsonResponse(
        { error: "Subscription has no Stripe ID; cannot upgrade" },
        400
      );
    }

    const currentPriceId = subscription.stripe_price_id;
    if (currentPriceId === newPriceId) {
      return jsonResponse(
        { error: "You are already on this plan", plan: planRow.display_name },
        400
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    const stripeSubscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
      { expand: ["items.data.price"] }
    );

    const item = stripeSubscription.items.data[0];
    if (!item) {
      return jsonResponse(
        { error: "Subscription has no line items; cannot upgrade" },
        400
      );
    }

    // Update subscription to the new price; Stripe will prorate
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        {
          id: item.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    return jsonResponse(
      {
        success: true,
        message: `Subscription upgraded to ${planRow.display_name}. You may see a prorated charge.`,
        plan: planRow.display_name,
        price_id: newPriceId,
      },
      200
    );
  } catch (err) {
    console.error("upgrade-subscription error:", err);
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      500
    );
  }
});

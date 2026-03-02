// Supabase Edge Function: Cancel Subscription
// Sets cancel_at_period_end on Stripe so the user is not charged after the current period.
// User keeps access until current_period_end.
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

    // Get customer linked to this user
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError || !customer) {
      return jsonResponse({ error: "Customer not found" }, 404);
    }

    // Get active subscription (active or trialing) that is not already set to cancel at period end
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, current_period_end, cancel_at_period_end")
      .eq("customer_id", customer.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup error:", subError);
      return jsonResponse({ error: "Failed to find subscription" }, 500);
    }

    if (!subscription) {
      return jsonResponse(
        { error: "No active subscription found to cancel" },
        404
      );
    }

    if (subscription.cancel_at_period_end) {
      return jsonResponse(
        {
          message: "Subscription is already set to cancel at the end of the billing period",
          current_period_end: subscription.current_period_end,
        },
        200
      );
    }

    const stripeSubscriptionId = subscription.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return jsonResponse(
        { error: "Subscription has no Stripe ID; cannot cancel" },
        400
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    // Cancel at period end: no further charges, access until current_period_end
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update our DB immediately so UI reflects change; webhook will sync again later
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Error updating subscription cancel_at_period_end:", updateError);
      // Stripe was updated; still return success
    }

    return jsonResponse(
      {
        success: true,
        message:
          "Subscription will cancel at the end of the current billing period. You will not be charged again and will keep access until then.",
        current_period_end: subscription.current_period_end,
      },
      200
    );
  } catch (err) {
    console.error("cancel-subscription error:", err);
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      500
    );
  }
});

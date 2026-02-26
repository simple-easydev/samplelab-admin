// Supabase Edge Function: Create Stripe Checkout Session
// Creates a Stripe checkout session for customer subscriptions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Missing STRIPE_SECRET_KEY");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    // Initialize Supabase client
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

    // Get authenticated user
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

    // Parse request body
    let body: {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
      isTrial?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const {
      priceId,
      successUrl = "http://localhost:3001/subscription/success",
      cancelUrl = "http://localhost:3001/subscription/cancel",
      isTrial = false,
    } = body;

    // If trial is enabled, it's always 3 days - duration cannot be overridden by frontend
    const trialPeriodDays = isTrial ? 3 : undefined;

    if (!priceId || typeof priceId !== "string") {
      return jsonResponse({ error: "Missing or invalid priceId" }, 400);
    }

    // Get customer from database
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, email, name, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError || !customer) {
      console.error("Customer not found:", customerError);
      return jsonResponse({ error: "Customer not found" }, 404);
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name || undefined,
        metadata: {
          supabase_customer_id: customer.id,
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Update customer record with Stripe customer ID
      const { error: updateError } = await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", customer.id);

      if (updateError) {
        console.error("Error updating customer with stripe_customer_id:", updateError);
      }
    }

    // Check if customer already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id, status, stripe_subscription_id")
      .eq("customer_id", customer.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSubscription) {
      // If already has active subscription, redirect to billing portal instead
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: successUrl,
      });

      return jsonResponse(
        {
          url: portalSession.url,
          type: "portal",
          message: "Customer already has an active subscription",
        },
        200
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        ...(trialPeriodDays !== undefined && { trial_period_days: trialPeriodDays }),
        metadata: {
          supabase_customer_id: customer.id,
          is_trial: isTrial.toString(),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_customer_id: customer.id,
        is_trial: isTrial.toString(),
      },
    });

    return jsonResponse(
      {
        url: session.url,
        sessionId: session.id,
        type: "checkout",
      },
      200
    );
  } catch (error) {
    console.error("Create checkout session error:", error);
    return jsonResponse(
      {
        error: error.message || "Internal server error",
      },
      500
    );
  }
});

// Supabase Edge Function: Stripe Webhook Handler
// Handles Stripe webhook events and updates subscriptions table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing Stripe configuration");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return jsonResponse({ error: "Missing signature" }, 400);
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return jsonResponse(
        { error: `Webhook signature verification failed: ${err.message}` },
        400
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // Initialize Supabase client with service role key
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

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreatedOrUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error("Webhook handler error:", error);
    return jsonResponse(
      { error: error.message || "Internal server error" },
      500
    );
  }
});

// Handle checkout session completed
async function handleCheckoutSessionCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log("Processing checkout.session.completed:", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error("Missing customer or subscription ID in checkout session");
    return;
  }

  // Get the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find customer by stripe_customer_id
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (customerError || !customer) {
    console.error("Customer not found for stripe_customer_id:", customerId);
    return;
  }

  // Create or update subscription record
  await upsertSubscription(supabase, customer.id, subscription);
}

// Handle subscription created or updated
async function handleSubscriptionCreatedOrUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription created/updated:", subscription.id);

  const customerId = subscription.customer as string;

  // Find customer by stripe_customer_id
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (customerError || !customer) {
    console.error("Customer not found for stripe_customer_id:", customerId);
    return;
  }

  // Upsert subscription record
  await upsertSubscription(supabase, customer.id, subscription);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription deleted:", subscription.id);

  // Update subscription status to canceled
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      stripe_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating canceled subscription:", error);
    throw error;
  }

  // Also update customer subscription_tier to 'free'
  const customerId = subscription.customer as string;
  const { error: customerError } = await supabase
    .from("customers")
    .update({
      subscription_tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (customerError) {
    console.error("Error updating customer tier:", customerError);
  }
}

// Handle invoice payment succeeded
async function handleInvoicePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log("Processing invoice.payment_succeeded:", invoice.id);

  if (!invoice.subscription) return;

  // Update subscription status to active
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      stripe_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (error) {
    console.error("Error updating subscription after payment:", error);
  }
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log("Processing invoice.payment_failed:", invoice.id);

  if (!invoice.subscription) return;

  // Update subscription status to past_due
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      stripe_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (error) {
    console.error("Error updating subscription after failed payment:", error);
  }
}

// Helper function to upsert subscription
async function upsertSubscription(
  supabase: any,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;
  const tier = mapStripePriceToTier(priceId);

  const subscriptionData = {
    customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier: tier,
    status: subscription.status === "active" || subscription.status === "trialing" ? "active" : subscription.status,
    stripe_status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  // Check if subscription already exists
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existing) {
    // Update existing subscription
    const { error } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  } else {
    // Insert new subscription
    const { error } = await supabase
      .from("subscriptions")
      .insert({
        ...subscriptionData,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Update customer subscription tier
  const { error: customerError } = await supabase
    .from("customers")
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (customerError) {
    console.error("Error updating customer tier:", customerError);
  }

  console.log(`Subscription ${subscription.id} upserted successfully`);
}

// Map Stripe price ID to subscription tier
// TODO: Update these price IDs with your actual Stripe price IDs
function mapStripePriceToTier(priceId: string | undefined): string {
  if (!priceId) return "free";

  // Map your Stripe price IDs to tiers
  const priceMap: Record<string, string> = {
    "price_starter_monthly": "starter",
    "price_starter_annual": "starter",
    "price_pro_monthly": "pro",
    "price_pro_annual": "pro",
    "price_enterprise_monthly": "enterprise",
    "price_enterprise_annual": "enterprise",
  };

  return priceMap[priceId] || "free";
}

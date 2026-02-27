// Supabase Edge Function: Create Plan Tier
// Inserts a new plan into public.plan_tiers and creates a Stripe product + prices (admin only).
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

type PlanBody = {
  name?: string;
  display_name?: string;
  description?: string | null;
  billing_cycle?: string;
  price?: number;
  original_price?: number | null;
  credits_monthly?: number;
  is_popular?: boolean;
  is_active?: boolean;
  features?: string[];
  sort_order?: number;
  stripe_price_id?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Optional: ensure caller is admin
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("is_admin", true)
      .maybeSingle();

    if (!adminUser) {
      return jsonResponse({ error: "Forbidden: admin only" }, 403);
    }

    let body: PlanBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const rawName = body.name?.trim();
    const displayName = body.display_name?.trim();

    if (!rawName) {
      return jsonResponse({ error: "Missing or invalid name" }, 400);
    }
    if (!displayName) {
      return jsonResponse({ error: "Missing or invalid display_name" }, 400);
    }

    const name = rawName.toLowerCase().replace(/\s+/g, "_");
    const billingCycle = (body.billing_cycle?.toLowerCase() === "year" ? "year" : "month") as "month" | "year";
    const price = Number(body.price) || 0;
    const originalPrice = body.original_price != null ? Number(body.original_price) : null;
    const creditsMonthly = Math.floor(Number(body.credits_monthly) || 0);
    const sortOrder = Math.floor(Number(body.sort_order) || 0);
    const features = Array.isArray(body.features)
      ? body.features.filter((f): f is string => typeof f === "string")
      : [];

    let stripePriceId: string | null = body.stripe_price_id?.trim() || null;

    // Create Stripe product and one price when plan has a paid price
    const shouldCreateStripe = price > 0;
    if (shouldCreateStripe) {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeSecretKey) {
        console.error("Missing STRIPE_SECRET_KEY");
        return jsonResponse(
          { error: "Stripe is not configured; cannot create paid plan" },
          500
        );
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-01-28.clover",
      });

      const productDescription = (body.description?.trim() || undefined) as string | undefined;
      const product = await stripe.products.create({
        name: displayName,
        description: productDescription || undefined,
        metadata: { plan_name: name },
      });

      const amountCents = Math.round(price * 100);
      const interval = billingCycle === "year" ? "year" : "month";
      const stripePrice = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: amountCents,
        recurring: { interval },
        metadata: { plan_name: name, interval },
      });
      stripePriceId = stripePrice.id;
    }

    const insertRow = {
      name,
      display_name: displayName,
      description: body.description?.trim() || null,
      billing_cycle: billingCycle,
      price,
      original_price: originalPrice,
      credits_monthly: creditsMonthly,
      is_popular: Boolean(body.is_popular),
      is_active: body.is_active !== false,
      features,
      sort_order: sortOrder,
      stripe_price_id: stripePriceId,
    };

    const { data: plan, error: insertError } = await supabase
      .from("plan_tiers")
      .insert(insertRow)
      .select()
      .single();

    if (insertError) {
      console.error("Insert plan_tiers error:", insertError);
      if (insertError.code === "23505") {
        return jsonResponse(
          { error: "A plan with this name already exists" },
          409
        );
      }
      return jsonResponse(
        { error: insertError.message || "Failed to create plan" },
        500
      );
    }

    return jsonResponse({ success: true, plan }, 201);
  } catch (err) {
    console.error("create-plan-tier error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

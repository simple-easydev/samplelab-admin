import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequestOrigin(req: Request): string {
  const originHeader = req.headers.get("origin");
  if (originHeader && originHeader.trim().length > 0) return originHeader;
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost";
  }
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, message: "Method not allowed" },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeSecretKey) {
      console.error("Missing required env vars", {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasAnonKey: Boolean(supabaseAnonKey),
        hasServiceKey: Boolean(supabaseServiceKey),
        hasStripeSecretKey: Boolean(stripeSecretKey),
      });
      return jsonResponse(
        { success: false, message: "Server configuration error" },
        500,
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      if (userError) console.error("auth.getUser error:", userError);
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    let body: { returnUrl?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const fallbackReturnUrl = getRequestOrigin(req);
    const returnUrl = body.returnUrl === undefined || body.returnUrl === null || body.returnUrl === ""
      ? fallbackReturnUrl
      : body.returnUrl;

    if (typeof returnUrl !== "string") {
      return jsonResponse(
        { success: false, message: "Invalid returnUrl" },
        400,
      );
    }
    try {
      // Stripe requires a valid absolute URL for return_url
      new URL(returnUrl);
    } catch {
      return jsonResponse(
        { success: false, message: "Invalid returnUrl" },
        400,
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingCustomer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, email, stripe_customer_id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("customers lookup error:", customerError);
      return jsonResponse(
        { success: false, message: "Failed to load customer", code: customerError.code },
        500,
      );
    }

    let stripeCustomerId: string | null = existingCustomer?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const email = existingCustomer?.email ?? user.email ?? null;
      if (!email) {
        return jsonResponse(
          { success: false, message: "User email is required to create Stripe customer" },
          400,
        );
      }

      const stripeCustomer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user.id },
      });

      stripeCustomerId = stripeCustomer.id;

      const { error: upsertError } = await supabaseAdmin
        .from("customers")
        .upsert(
          {
            user_id: user.id,
            email,
            stripe_customer_id: stripeCustomerId,
          },
          { onConflict: "user_id" },
        );

      if (upsertError) {
        console.error("customers upsert error:", upsertError);
        return jsonResponse(
          { success: false, message: "Failed to persist Stripe customer id", code: upsertError.code },
          500,
        );
      }
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return jsonResponse(
      { success: true, url: portalSession.url, stripeCustomerId },
      200,
    );
  } catch (err) {
    console.error("create-stripe-billing-portal-session error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const code = typeof (err as { code?: unknown })?.code === "string"
      ? (err as { code: string }).code
      : undefined;
    const statusCode = typeof (err as { statusCode?: unknown })?.statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : undefined;
    const status = statusCode && statusCode >= 400 && statusCode < 500 ? 400 : 500;

    return jsonResponse(
      { success: false, message, ...(code ? { code } : {}) },
      status,
    );
  }
});

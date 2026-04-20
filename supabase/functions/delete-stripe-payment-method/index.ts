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

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function getStripeCustomerIdFromPaymentMethod(pm: Stripe.PaymentMethod): string | null {
  const c = pm.customer;
  if (!c) return null;
  if (typeof c === "string") return c;
  if (typeof (c as { id?: unknown }).id === "string") return (c as { id: string }).id;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed" }, 405);
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
      return jsonResponse({ success: false, message: "Server configuration error" }, 500);
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

    let body: { paymentMethodId?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, message: "Invalid JSON body" }, 400);
    }

    const paymentMethodId = body.paymentMethodId;
    if (typeof paymentMethodId !== "string" || paymentMethodId.trim().length === 0) {
      return jsonResponse({ success: false, message: "Missing or invalid paymentMethodId" }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: customerRow, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("customers lookup error:", customerError);
      return jsonResponse(
        { success: false, message: "Failed to load customer", code: customerError.code },
        500,
      );
    }

    const stripeCustomerId = customerRow?.stripe_customer_id ?? null;
    if (!stripeCustomerId || typeof stripeCustomerId !== "string") {
      return jsonResponse({ success: false, message: "Customer not found" }, 404);
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod && "deleted" in paymentMethod && paymentMethod.deleted) {
      return jsonResponse({ success: false, message: "Payment method not found" }, 404);
    }

    const pm = paymentMethod as Stripe.PaymentMethod;
    const pmCustomerId = getStripeCustomerIdFromPaymentMethod(pm);
    if (!pmCustomerId || pmCustomerId !== stripeCustomerId) {
      return jsonResponse({ success: false, message: "Forbidden" }, 403);
    }

    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
    const defaultPm = (stripeCustomer && "deleted" in stripeCustomer && stripeCustomer.deleted)
      ? null
      : (stripeCustomer as Stripe.Customer).invoice_settings?.default_payment_method ?? null;
    const defaultPmId = typeof defaultPm === "string"
      ? defaultPm
      : (defaultPm && typeof (defaultPm as { id?: unknown }).id === "string"
        ? (defaultPm as { id: string }).id
        : null);

    await stripe.paymentMethods.detach(paymentMethodId);

    if (defaultPmId === paymentMethodId) {
      const remaining = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
        limit: 10,
      });
      const nextDefault = remaining.data.find((m) => m.id !== paymentMethodId)?.id ?? null;

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: nextDefault },
      });
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("delete-stripe-payment-method error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const code = typeof (err as { code?: unknown })?.code === "string"
      ? (err as { code: string }).code
      : undefined;
    const statusCode = typeof (err as { statusCode?: unknown })?.statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : undefined;
    const status = statusCode && statusCode >= 400 && statusCode < 500 ? 400 : 500;

    return jsonResponse({ success: false, message, ...(code ? { code } : {}) }, status);
  }
});


// Supabase Edge Function: Get Stripe billing details (auth required)
// Returns saved payment methods + recent transaction history for the logged-in user.
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

type BillingDetailsBody = {
  limit?: number;
};

function normalizeDefaultPaymentMethodId(
  pm: Stripe.Customer.InvoiceSettings.DefaultPaymentMethod | null | undefined,
): string | null {
  if (!pm) return null;
  if (typeof pm === "string") return pm;
  // Stripe may return expanded PaymentMethod objects.
  if (typeof (pm as { id?: unknown })?.id === "string") return (pm as { id: string }).id;
  return null;
}

async function findBestStripeCustomerIdForUser(
  stripe: Stripe,
  userId: string,
  email: string | null,
): Promise<{ stripeCustomerId: string | null; candidates: string[] }> {
  const candidates: string[] = [];

  // Prefer metadata match (created by our portal-session function).
  try {
    const res = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
      limit: 10,
    });
    for (const c of res.data) candidates.push(c.id);
  } catch {
    // customers.search may be unavailable on some accounts/plans; ignore.
  }

  // Fallback by email (may return multiple customers over time).
  if (email) {
    try {
      const res = await stripe.customers.list({ email, limit: 10 });
      for (const c of res.data) {
        if (!candidates.includes(c.id)) candidates.push(c.id);
      }
    } catch {
      // ignore
    }
  }

  for (const id of candidates) {
    try {
      const pms = await stripe.customers.listPaymentMethods(id, { type: "card", limit: 1 });
      if (pms.data.length > 0) return { stripeCustomerId: id, candidates };
    } catch {
      // ignore candidate errors
    }
  }

  return { stripeCustomerId: candidates[0] ?? null, candidates };
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
    if (!authHeader?.startsWith("Bearer ")) {
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

    let body: BillingDetailsBody = {};
    try {
      body = (await req.json().catch(() => ({}))) as BillingDetailsBody;
    } catch {
      body = {};
    }
    const limitRaw = typeof body.limit === "number" ? body.limit : 25;
    const limit = Math.max(1, Math.min(100, Math.floor(limitRaw)));

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("customers lookup error:", customerError);
      return jsonResponse({ error: "Failed to load customer" }, 500);
    }

    let stripeCustomerId = customer?.stripe_customer_id?.trim() || null;
    if (!stripeCustomerId) {
      const recovered = await findBestStripeCustomerIdForUser(
        stripe,
        user.id,
        user.email ?? null,
      );
      stripeCustomerId = recovered.stripeCustomerId;
    }

    if (!stripeCustomerId) {
      return jsonResponse(
        {
          success: true,
          stripeCustomerId: null,
          diagnostics: {
            reason: "no_stripe_customer_id",
          },
          paymentMethods: [],
          transactions: [],
        },
        200,
      );
    }

    let paymentMethods: Stripe.ApiList<Stripe.PaymentMethod>;
    let stripeCustomer: Stripe.Customer | Stripe.DeletedCustomer;
    let invoices: Stripe.ApiList<Stripe.Invoice>;
    let paymentIntents: Stripe.ApiList<Stripe.PaymentIntent>;

    try {
      [paymentMethods, stripeCustomer, invoices, paymentIntents] = await Promise.all([
        stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: "card",
          limit: 10,
        }),
        stripe.customers.retrieve(stripeCustomerId, {
          expand: ["invoice_settings.default_payment_method"],
        }),
        stripe.invoices.list({
          customer: stripeCustomerId,
          limit,
        }),
        stripe.paymentIntents.list({
          customer: stripeCustomerId,
          limit,
        }),
      ]);
    } catch (err) {
      // If the stored stripe_customer_id is stale/wrong, try recovery.
      const recovered = await findBestStripeCustomerIdForUser(
        stripe,
        user.id,
        user.email ?? null,
      );
      if (!recovered.stripeCustomerId || recovered.stripeCustomerId === stripeCustomerId) throw err;

      stripeCustomerId = recovered.stripeCustomerId;

      [paymentMethods, stripeCustomer, invoices, paymentIntents] = await Promise.all([
        stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: "card",
          limit: 10,
        }),
        stripe.customers.retrieve(stripeCustomerId, {
          expand: ["invoice_settings.default_payment_method"],
        }),
        stripe.invoices.list({
          customer: stripeCustomerId,
          limit,
        }),
        stripe.paymentIntents.list({
          customer: stripeCustomerId,
          limit,
        }),
      ]);
    }

    const defaultPaymentMethodRaw =
      "deleted" in stripeCustomer
        ? null
        : stripeCustomer.invoice_settings?.default_payment_method ?? null;

    const defaultPaymentMethodId = normalizeDefaultPaymentMethodId(defaultPaymentMethodRaw);

    // Fallback: some accounts behave better with customers.listPaymentMethods.
    // If the portal-added card isn't showing up via paymentMethods.list, this often reveals it.
    const customerPaymentMethods = await stripe.customers.listPaymentMethods(stripeCustomerId, {
      type: "card",
      limit: 10,
    });

    const combinedById = new Map<string, Stripe.PaymentMethod>();
    for (const pm of paymentMethods.data) combinedById.set(pm.id, pm);
    for (const pm of customerPaymentMethods.data) combinedById.set(pm.id, pm);

    // If Stripe returns a default payment method id but list endpoints return empty,
    // explicitly retrieve the payment method to detect cross-customer / mode mismatch.
    let defaultPaymentMethodDetails:
      | { id: string; type: string | null; customer: string | null; isCard: boolean }
      | null = null;
    if (defaultPaymentMethodId && !combinedById.has(defaultPaymentMethodId)) {
      try {
        const retrieved = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
        if (!(retrieved && "deleted" in retrieved && retrieved.deleted)) {
          const pm = retrieved as Stripe.PaymentMethod;
          const pmCustomer =
            typeof pm.customer === "string"
              ? pm.customer
              : (pm.customer && typeof (pm.customer as { id?: unknown })?.id === "string"
                ? (pm.customer as { id: string }).id
                : null);
          defaultPaymentMethodDetails = {
            id: pm.id,
            type: pm.type ?? null,
            customer: pmCustomer,
            isCard: pm.type === "card",
          };

          // Only include it in the response if it actually belongs to this customer.
          if (pmCustomer === stripeCustomerId && pm.type === "card") {
            combinedById.set(pm.id, pm);
          }
        }
      } catch {
        // ignore retrieve errors; diagnostics will still show list counts
      }
    }

    const combinedCards = Array.from(combinedById.values()).sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

    const cards = combinedCards.map((pm) => ({
      id: pm.id,
      type: pm.type,
      isDefault: defaultPaymentMethodId != null && defaultPaymentMethodId === pm.id,
      card: pm.card
        ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
        : null,
      billingDetails: {
        name: pm.billing_details?.name ?? null,
        email: pm.billing_details?.email ?? null,
      },
      created: pm.created,
    }));

    const txFromInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      kind: "invoice" as const,
      created: inv.created,
      currency: inv.currency,
      status: inv.status,
      amount: inv.total ?? null,
      amountPaid: inv.amount_paid ?? null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
      description: inv.description ?? null,
      stripeUrl: inv.hosted_invoice_url ?? inv.invoice_pdf ?? null,
    }));

    const txFromPaymentIntents = paymentIntents.data.map((pi) => ({
      id: pi.id,
      kind: "payment_intent" as const,
      created: pi.created,
      currency: pi.currency,
      status: pi.status,
      amount: pi.amount ?? null,
      amountReceived: pi.amount_received ?? null,
      description: pi.description ?? null,
      receiptEmail: pi.receipt_email ?? null,
      stripeUrl: null as string | null,
    }));

    const merged = [...txFromInvoices, ...txFromPaymentIntents].sort(
      (a, b) => (b.created ?? 0) - (a.created ?? 0),
    );

    return jsonResponse(
      {
        success: true,
        stripeCustomerId,
        diagnostics: {
          defaultPaymentMethodId,
          defaultPaymentMethodDetails,
          paymentMethodsListCount: paymentMethods.data.length,
          customerListPaymentMethodsCount: customerPaymentMethods.data.length,
          mergedCardCount: cards.length,
        },
        paymentMethods: cards,
        transactions: merged.slice(0, limit),
      },
      200,
    );
  } catch (err) {
    console.error("get-stripe-billing-details error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});


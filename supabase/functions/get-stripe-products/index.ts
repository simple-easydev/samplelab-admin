// Supabase Edge Function: Get Stripe Products
// Fetches active products and prices from Stripe for display on the frontend
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

interface ProductWithPrices {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Stripe.Metadata;
  prices: Array<{
    id: string;
    currency: string;
    unit_amount: number;
    recurring: {
      interval: string;
      interval_count: number;
    } | null;
    type: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
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
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Fetch active products with expanded default prices
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    });

    // Fetch ALL active prices to get monthly, annual, etc. (not just default)
    const prices = await stripe.prices.list({
      active: true,
      limit: 100, // Increase if you have more than 100 prices
    });

    // Group prices by product ID
    const pricesByProduct = new Map<string, Stripe.Price[]>();
    for (const price of prices.data) {
      const productId = typeof price.product === "string" 
        ? price.product 
        : price.product.id;
      
      if (!pricesByProduct.has(productId)) {
        pricesByProduct.set(productId, []);
      }
      pricesByProduct.get(productId)!.push(price);
    }

    // Format products with ALL their prices (monthly, annual, etc.)
    const productsWithPrices: ProductWithPrices[] = products.data.map((product) => {
      const productPrices = pricesByProduct.get(product.id) || [];
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        prices: productPrices.map((price) => ({
          id: price.id,
          currency: price.currency,
          unit_amount: price.unit_amount || 0,
          recurring: price.recurring ? {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          } : null,
          type: price.type,
        })),
      };
    });

    // Sort by metadata.order if exists, otherwise by name
    productsWithPrices.sort((a, b) => {
      const orderA = parseInt(a.metadata.order || "999");
      const orderB = parseInt(b.metadata.order || "999");
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return jsonResponse(
      {
        success: true,
        products: productsWithPrices,
        count: productsWithPrices.length,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});

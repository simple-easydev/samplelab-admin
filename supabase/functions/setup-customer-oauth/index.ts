// Supabase Edge Function: Setup Customer OAuth
// After Google/OAuth login, mark user as customer and trigger customer profile creation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Check if customer profile already exists
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer) {
      return jsonResponse(
        {
          success: true,
          message: "Customer profile already exists",
          customer: existingCustomer,
        },
        200
      );
    }

    // Optional: update user metadata (trigger already created customer on auth INSERT)
    const currentMetadata = user.user_metadata || {};
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...currentMetadata,
        is_customer: true,
        real_email: user.email,
      },
    });

    // Customer is created by DB trigger on auth sign-in; fetch and return it
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();

    return jsonResponse(
      {
        success: true,
        message: customer
          ? "Customer profile ready"
          : "Customer profile may still be creating; please retry",
        customer: customer ?? null,
      },
      200
    );
  } catch (error) {
    console.error("Setup customer OAuth error:", error);
    return jsonResponse(
      {
        error: error.message || "Internal server error",
      },
      500
    );
  }
});

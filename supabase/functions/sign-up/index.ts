// Supabase Edge Function: Customer sign-up only.
// Does NOT use public.users or admin auth flow. Creates auth.users + public.customers
// via trigger (handle_new_user with is_customer: true). For admin users, use invite + setup-admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Auth email prefix for customers so same email can have separate admin vs customer password */
const CUSTOMER_EMAIL_PREFIX = "customer_";

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: { email?: string; password?: string; name?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { email, password, name } = body;
    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "Missing or invalid email" }, 400);
    }
    if (!password || typeof password !== "string") {
      return jsonResponse({ error: "Missing or invalid password" }, 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return jsonResponse({ error: "Invalid email format" }, 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Block only if this email already has a customer profile (same email can be admin and customer with different passwords)
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingCustomer) {
      return jsonResponse({ error: "A customer account with this email already exists" }, 409);
    }

    // Use prefixed auth email so customer has a separate auth account (and password) from admin
    const authEmail = CUSTOMER_EMAIL_PREFIX + trimmedEmail;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: false,
      user_metadata: {
        is_customer: true,
        real_email: trimmedEmail,
        ...(name ? { name: name.trim() } : {}),
      },
    });

    if (authError) {
      console.error("Sign-up createUser error:", authError);
      if (authError.message?.toLowerCase().includes("already been registered") || authError.message?.toLowerCase().includes("already exists")) {
        return jsonResponse({ error: "A customer account with this email already exists" }, 409);
      }
      return jsonResponse(
        { error: authError.message || "Failed to create account" },
        422
      );
    }

    if (!authData?.user?.id) {
      return jsonResponse({ error: "Account could not be created" }, 500);
    }

    return jsonResponse(
      {
        success: true,
        message:
          "Account created. A confirmation email will be sent if email confirmation is enabled in your project.",
        user_id: authData.user.id,
      },
      201
    );
  } catch (err) {
    console.error("Sign-up error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

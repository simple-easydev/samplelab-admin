// Supabase Edge Function: Customer sign-up only.
// Does NOT use public.users or admin auth flow. Creates auth.users + public.customers
// via trigger (handle_new_user with is_customer: true). Sends confirmation email via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // Create auth user with customer email (no prefix)
    const { data: linkData, error: authError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: trimmedEmail,
      password,
      options: {
        data: {
          is_customer: true,
          ...(name ? { name: name.trim() } : {}),
        },
        redirectTo: "http://localhost:3001/login",
      },
    });

    if (authError) {
      console.error("Sign-up generateLink error:", authError);
      if (authError.message?.toLowerCase().includes("already been registered") || authError.message?.toLowerCase().includes("already exists")) {
        return jsonResponse({ error: "A customer account with this email already exists" }, 409);
      }
      return jsonResponse(
        { error: authError.message || "Failed to create account" },
        422
      );
    }

    const user = linkData?.user;
    const confirmationLink =
      (linkData as { properties?: { action_link?: string } })?.properties?.action_link ?? null;

    if (!user?.id) {
      return jsonResponse({ error: "Account could not be created" }, 500);
    }

    // Send confirmation email via Resend so user can confirm and sign in
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "The Sample Lab <noreply@thesamplelab.app>";
    if (resendApiKey && confirmationLink) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: sendError } = await resend.emails.send({
          from: fromAddress,
          to: [trimmedEmail],
          subject: "Confirm your email – The Sample Lab",
          html: `
            <!DOCTYPE html>
            <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirm your email</title></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">The Sample Lab</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Confirm your email</p>
                </div>
                <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="margin-top: 0;">Thanks for signing up. Please confirm your email address by clicking the button below.</p>
                  <p style="margin: 24px 0;">
                    <a href="${confirmationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirm email</a>
                  </p>
                  <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
                  <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">Or copy and paste this link: ${confirmationLink}</p>
                </div>
              </body>
            </html>
          `,
        });
        if (sendError) console.error("Resend confirmation email error:", sendError);
      } catch (e) {
        console.error("Send confirmation email failed:", e);
      }
    }

    return jsonResponse(
      {
        success: true,
        message: "Account created. Please check your email to confirm your address.",
        user_id: user.id,
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

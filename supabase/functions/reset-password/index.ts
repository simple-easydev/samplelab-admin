// Supabase Edge Function: Customer password reset only.
// Generates password reset link for customers (with customer_ email prefix)
// and sends reset email via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { email } = body;
    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "Missing or invalid email" }, 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return jsonResponse({ error: "Invalid email format" }, 400);
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

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, status")
      .eq("email", trimmedEmail)
      .maybeSingle();

    // Always return success even if customer doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (!existingCustomer) {
      return jsonResponse(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        200
      );
    }

    // Check if customer account is active
    if (existingCustomer.status !== "active") {
      return jsonResponse(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        200
      );
    }

    // Use prefixed auth email for password reset
    const authEmail = CUSTOMER_EMAIL_PREFIX + trimmedEmail;
    const { data: linkData, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: authEmail,
      options: {
        redirectTo: "http://localhost:3001/reset-password",
      },
    });

    if (resetError) {
      console.error("Password reset generateLink error:", resetError);
      // Still return success to prevent email enumeration
      return jsonResponse(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        200
      );
    }

    const resetLink =
      (linkData as { properties?: { action_link?: string } })?.properties?.action_link ?? null;

    // Send password reset email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "The Sample Lab <noreply@thesamplelab.app>";
    
    if (resendApiKey && resetLink) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: sendError } = await resend.emails.send({
          from: fromAddress,
          to: [trimmedEmail],
          subject: "Reset your password – The Sample Lab",
          html: `
            <!DOCTYPE html>
            <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset your password</title></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">The Sample Lab</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Reset your password</p>
                </div>
                <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="margin-top: 0;">We received a request to reset your password. Click the button below to choose a new password.</p>
                  <p style="margin: 24px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
                  </p>
                  <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                  <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This link will expire in 60 minutes for security reasons.</p>
                  <p style="color: #9ca3af; font-size: 12px; word-break: break-all; margin-top: 24px;">Or copy and paste this link: ${resetLink}</p>
                </div>
              </body>
            </html>
          `,
        });
        if (sendError) console.error("Resend password reset email error:", sendError);
      } catch (e) {
        console.error("Send password reset email failed:", e);
      }
    }

    return jsonResponse(
      {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      },
      200
    );
  } catch (err) {
    console.error("Password reset error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

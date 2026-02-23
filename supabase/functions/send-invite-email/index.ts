// Supabase Edge Function: Send admin invite email
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailPayload {
  email: string;
  role: "full_admin" | "content_editor";
  inviteLink: string;
  inviterName?: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token
    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a full admin
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    if (userDataError || !userData?.is_admin || userData.role !== "full_admin") {
      console.error("Admin check failed:", userDataError, userData);
      return new Response(
        JSON.stringify({ error: "Only full admins can send invites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, inviteLink, inviterName, message }: InviteEmailPayload = await req.json();

    if (!email || !role || !inviteLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, role, inviteLink" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists (public.users table; no auth.admin.getUserByEmail in supabase-js)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Resend with API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const resend = new Resend(resendApiKey);

    // Determine role display name
    const roleDisplay = role === "full_admin" ? "Super Admin" : "Content Admin";

    // From: use env RESEND_FROM_EMAIL if set (e.g. "The Sample Lab <noreply@thesamplelab.app>"), else default
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "The Sample Lab <noreply@thesamplelab.app>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "You've been invited to The Sample Lab Admin Panel",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎛️ The Sample Lab</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Admin Panel Invitation</p>
            </div>
            
            <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 24px;">You've been invited!</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                ${inviterName ? `<strong>${inviterName}</strong> has invited you` : 'You have been invited'} 
                to join The Sample Lab Admin Panel as a <strong>${roleDisplay}</strong>.
              </p>
              
              ${message ? `
                <div style="background: #f3f4f6; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #4b5563; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              
              <div style="margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation & Set Up Account
                </a>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⏰ This invitation expires in 7 days.</strong>
                </p>
              </div>
              
              <h3 style="color: #1f2937; font-size: 18px; margin-top: 30px;">What's next?</h3>
              <ol style="color: #4b5563; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Click the button above to accept your invitation</li>
                <li style="margin-bottom: 10px;">Set up your account with a secure password</li>
                <li style="margin-bottom: 10px;">Start managing The Sample Lab admin panel</li>
              </ol>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                  If you didn't expect this invitation or the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin: 10px 0 0 0;">
                  ${inviteLink}
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © ${new Date().getFullYear()} The Sample Lab. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

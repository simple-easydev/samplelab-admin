// Supabase Edge Function: Test Resend email delivery
// Use this to verify RESEND_API_KEY and Resend are working.
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let to = "dev.sheng.yu@gmail.com";
    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.to && typeof body.to === "string" && body.to.includes("@")) {
          to = body.to;
        }
      } catch {
        // ignore, use default
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY environment variable is not set. Add it in Supabase Dashboard → Project Settings → Edge Functions → Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // From address: use env RESEND_FROM_EMAIL if set, else verified domain. Must be an address on your verified domain (e.g. noreply@thesamplelab.app).
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "The Sample Lab <noreply@thesamplelab.app>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: "Resend test – The Sample Lab Admin",
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><title>Resend test</title></head>
          <body style="font-family: sans-serif; padding: 20px; max-width: 600px;">
            <h1 style="color: #333;">Resend test email</h1>
            <p>If you received this, Resend is configured correctly for The Sample Lab Admin.</p>
            <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">The Sample Lab Admin – test-resend-email edge function</p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email",
          details: error,
          fromUsed: fromAddress,
          hint: "Ensure (1) domain thesamplelab.app is Verified (green) at resend.com/domains, (2) you redeployed this function after changing the from address, (3) RESEND_FROM_EMAIL secret if set uses that exact address (e.g. 'The Sample Lab <noreply@thesamplelab.app>').",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data?.id,
        to,
        from: fromAddress,
        message: "Test email sent. Check the recipient inbox (and spam folder).",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("test-resend-email error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Supabase Edge Function: create admin user from invite (uses service role)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, fullName, password } = await req.json();
    if (!token || !fullName || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data: invite, error: inviteError } = await supabase
      .from("admin_invites")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Invalid or used invitation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user (trigger will create basic user record)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message || "Failed to create account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Account created but user id missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Update the trigger-created user record to admin status
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: fullName,
        is_admin: true,
        role: invite.role,
        status: 'active',
        invited_by: invite.invited_by,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (userError) {
      // Clean up auth user if database update fails
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          error: userError.message || "Failed to update user record to admin status",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("admin_invites").update({ used: true }).eq("token", token);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

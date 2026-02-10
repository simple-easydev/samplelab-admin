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

    // Check if user already exists in database (pending status from invitation)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, status")
      .eq("email", invite.email)
      .single();

    let userId: string;

    if (existingUser) {
      // User record exists (from invitation) - update it
      userId = existingUser.id;
      console.log(`Updating existing user record: ${userId}`);

      // Check if auth user exists
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === invite.email);

      if (!existingAuthUser) {
        // Create auth user with the same ID as database record
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
      }

      // Update the pending user record
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: fullName,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message || "Failed to update user record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // No existing database record - check if auth user exists or create one
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === invite.email);

      if (existingAuthUser) {
        // Auth user exists - use their ID
        userId = existingAuthUser.id;
        console.log(`Using existing auth user: ${userId}`);
      } else {
        // Create new auth user
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

        userId = authData.user.id;
      }

      // Create database record
      const { error: userError } = await supabase.rpc("create_admin_user_record", {
        p_id: userId,
        p_email: invite.email,
        p_name: fullName,
        p_role: invite.role,
      });

      if (userError) {
        // Clean up auth user if database creation fails
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({
            error: userError.message || "Database error. Ensure migration 20260205000002 is applied.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

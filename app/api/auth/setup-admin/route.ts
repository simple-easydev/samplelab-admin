import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { token, fullName, password } = await request.json();

    if (!token || !fullName || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate invite
    const { data: invite, error: inviteError } = await supabase
      .from("admin_invites")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single<{
        email: string;
        role: string;
        expires_at: string;
      }>();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or used invitation" }, { status: 404 });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth createUser error:", authError.message, authError);
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 500 }
      );
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: "Account was created but user id was missing" },
        { status: 500 }
      );
    }

    // Create user record via SECURITY DEFINER function (bypasses RLS)
    const { error: userError } = await supabase.rpc("create_admin_user_record", {
      p_id: authData.user.id,
      p_email: invite.email,
      p_name: fullName,
      p_role: invite.role,
    });

    if (userError) {
      console.error("create_admin_user_record error:", userError.message, userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        {
          error:
            userError.message ||
            "Database error creating new user. Ensure migration 20260205000002 has been applied.",
        },
        { status: 500 }
      );
    }

    // Mark invite as used
    const { error: updateInviteError } = await supabase
      .from("admin_invites")
      .update({ used: true })
      .eq("token", token);

    if (updateInviteError) {
      console.error("Failed to mark invite as used:", updateInviteError);
      // Don't fail the request - user was created successfully
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

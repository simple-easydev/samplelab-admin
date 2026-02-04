import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 });
    }

    // Use admin client: invite link is opened by unauthenticated users,
    // so RLS would block the read. We only return valid/email/role for this token.
    const supabase = createAdminClient();

    // Check if invite exists and is valid
    const { data: invite, error } = await supabase
      .from("admin_invites")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single<{
        email: string;
        role: string;
        expires_at: string;
      }>();

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      role: invite.role,
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

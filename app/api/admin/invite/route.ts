import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Check if user is full admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("id", user.id)
      .single<{ is_admin: boolean; role: string }>();

    if (!userData?.is_admin || userData.role !== "full_admin") {
      return NextResponse.json(
        { error: "Only full admins can invite new admins" },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    if (role !== "full_admin" && role !== "content_editor") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invite (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error: inviteError } = await supabase
      .from("admin_invites")
      .insert({
        email,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      } as any)
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/login?token=${token}`;

    return NextResponse.json({
      success: true,
      invite,
      inviteLink,
    });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single<{ is_admin: boolean }>();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all invites
    const { data: invites, error } = await supabase
      .from("admin_invites")
      .select("*, invited_by:users(name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ invites });
  } catch (error: any) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

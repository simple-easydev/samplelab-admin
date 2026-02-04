import { createServerClient } from "./supabase-server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  const supabase = await createServerClient();
  const { data: userData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single<{ is_admin: boolean }>();

  if (!userData?.is_admin) {
    redirect("/dashboard");
  }

  return user;
}

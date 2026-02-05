import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "admin" | "redirect-login" | "redirect-dashboard">("loading");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setStatus("redirect-login");
        return;
      }
      // Client-side admin check (same as Login page) - no dependency on API server
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single<{ is_admin: boolean }>();

      if (!cancelled) {
        setStatus(userData?.is_admin ? "admin" : "redirect-dashboard");
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }
  if (status === "redirect-login") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (status === "redirect-dashboard") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

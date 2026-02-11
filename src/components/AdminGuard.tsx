import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import ShieldSpinner from "@/components/ui/ShieldSpinner";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "admin" | "redirect-login" | "redirect-dashboard">("loading");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (!cancelled) setStatus("redirect-login");
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to login");
          if (!cancelled) setStatus("redirect-login");
          return;
        }

        console.log("Session found for user:", session.user.id);

        // Client-side admin check (same as Login page) - no dependency on API server
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", session.user.id)
          .single<{ is_admin: boolean }>();

        if (userError) {
          console.error("User query error:", userError);
          // If user not found in users table, redirect to login
          if (!cancelled) setStatus("redirect-login");
          return;
        }

        console.log("User data:", userData);

        if (!cancelled) {
          setStatus(userData?.is_admin ? "admin" : "redirect-dashboard");
        }
      } catch (err) {
        console.error("AdminGuard check error:", err);
        if (!cancelled) setStatus("redirect-login");
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center space-y-4">
          <ShieldSpinner size="lg" className="mx-auto" />
          <div>
            <p className="text-lg font-medium">Checking access...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verifying your admin credentials
            </p>
          </div>
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

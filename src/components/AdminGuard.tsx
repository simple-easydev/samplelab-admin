import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="relative">
              <Shield className="h-16 w-16 mx-auto text-primary/20" />
              <Loader2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium">Checking access...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifying your admin credentials
              </p>
            </div>
          </CardContent>
        </Card>
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

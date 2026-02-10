import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: "full_admin";
}

export default function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized" | "error">("loading");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (!cancelled) setStatus("unauthorized");
          return;
        }

        // Check user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single<{ role: string }>();

        if (userError) {
          console.error("Role check error:", userError);
          if (!cancelled) setStatus("error");
          return;
        }

        setUserRole(userData?.role || null);

        if (!cancelled) {
          if (userData?.role === requiredRole) {
            setStatus("authorized");
          } else {
            setStatus("unauthorized");
          }
        }
      } catch (err) {
        console.error("RoleGuard check error:", err);
        if (!cancelled) setStatus("error");
      }
    }

    checkRole();
    return () => { cancelled = true; };
  }, [requiredRole]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <p className="text-muted-foreground">Verifying permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
            <div>
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground mt-2">
                You don't have permission to access this page.
              </p>
              {userRole && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your current role: <span className="font-medium">{userRole === "content_editor" ? "Content Editor" : userRole}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Required role: <span className="font-medium">Full Admin</span>
              </p>
            </div>
            <Button onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

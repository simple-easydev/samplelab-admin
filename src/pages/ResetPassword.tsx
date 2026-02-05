import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Key, Loader2, AlertCircle, XCircle, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const establishSession = async () => {
      const code = searchParams.get("code");
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          setSessionReady(true);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Invalid or expired reset link");
        } finally {
          setVerifying(false);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          try {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) throw setSessionError;
            setSessionReady(true);
            window.history.replaceState(null, "", window.location.pathname);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid or expired reset link");
          }
        } else {
          setError("Invalid or expired reset link. Please request a new password reset.");
        }
      }
      setVerifying(false);
    };

    establishSession();
  }, [searchParams]);

  const validatePassword = () => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!sessionReady) {
      setError("Please wait for the reset link to be verified.");
      return;
    }
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/login?reset=success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <CardTitle className="text-2xl">Verifying reset link...</CardTitle>
            <CardDescription>Please wait a moment.</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionReady && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <CardTitle className="text-2xl">Link Invalid or Expired</CardTitle>
            <CardDescription>{error}</CardDescription>
            <Button asChild>
              <Link to="/auth/forgot-password">Request new reset link</Link>
            </Button>
            <div className="pt-4">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Log In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
              <div className="space-y-1 mt-2">
                <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
                <ul className="text-xs space-y-1 ml-4">
                  <li className={password.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                    <Check className="inline h-3 w-3 mr-1" />
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                    <Check className="inline h-3 w-3 mr-1" />
                    One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                    <Check className="inline h-3 w-3 mr-1" />
                    One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                    <Check className="inline h-3 w-3 mr-1" />
                    One number
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Resetting Password..." : "Reset Password & Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

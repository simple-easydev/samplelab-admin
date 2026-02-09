import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Target, Loader2, XCircle, Check, AlertCircle, Shield, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SetupAdmin() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"full_admin" | "content_editor">("content_editor");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setValidating(false);
        return;
      }
      try {
        const { data: rows, error: rpcError } = await supabase.rpc("get_invite_by_token", {
          p_token: token,
        });
        if (rpcError) throw new Error("Invalid or expired invitation");
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row?.email) throw new Error("Invalid or expired invitation");
        if (new Date(row.expires_at) < new Date()) throw new Error("Invitation has expired");
        setEmail(row.email);
        setRole(row.role as "full_admin" | "content_editor");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid or expired invitation");
      } finally {
        setValidating(false);
      }
    };
    validateInvite();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      const { data, error: fnError } = await supabase.functions.invoke("setup-admin", {
        body: { token, fullName, password },
      });
      
      // Log full response for debugging
      console.log("Edge Function response:", { data, error: fnError });
      
      if (fnError) {
        // Try to get more details from the error
        const errorMessage = fnError.message || fnError.toString();
        console.error("Edge Function error details:", fnError);
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        console.error("Edge Function returned error:", data.error);
        throw new Error(data.error);
      }
      
      if (!data?.success) {
        throw new Error("Unexpected response from server");
      }
      
      navigate("/login?setup=success");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set up account";
      console.error("Setup error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
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
            <Target className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Set Up Admin Account</CardTitle>
          <CardDescription>Complete your profile to get started</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <div className="flex items-center gap-2">
              {role === "full_admin" ? (
                <Shield className="h-4 w-4" />
              ) : (
                <UserCog className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>Role:</strong>{" "}
                <Badge variant={role === "full_admin" ? "destructive" : "default"}>
                  {role === "full_admin" ? "Full Admin" : "Content Editor"}
                </Badge>
              </AlertDescription>
            </div>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input type="email" value={email} disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                New Password <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
              <ul className="text-xs space-y-1 ml-4 mt-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirm Password <span className="text-destructive">*</span>
              </label>
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
              {loading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, CheckCircle, Shield, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InviteAdminPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"full_admin" | "content_editor">("content_editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const navigate = useNavigate();

  function generateToken(): string {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteLink("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not signed in");

      const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
      if (existing) throw new Error("User with this email already exists");

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: insertError } = await supabase.from("admin_invites").insert({
        email,
        role,
        invited_by: session.user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) throw insertError;

      const link = `${window.location.origin}/login?token=${token}`;
      setInviteLink(link);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  if (inviteLink) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              Invitation Sent!
            </h1>
            <p className="text-muted-foreground mt-1">Share this link with the new admin</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admins
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Invited Email</label>
              <p className="text-lg font-semibold">{email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Badge variant={role === "full_admin" ? "destructive" : "default"}>
                {role === "full_admin" ? "Full Admin" : "Content Editor"}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Invitation Link</label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Link expires in 7 days</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              setEmail("");
              setInviteLink("");
              setRole("content_editor");
            }}
            className="flex-1"
          >
            Invite Another Admin
          </Button>
          <Button onClick={() => navigate("/admin/roles")} className="flex-1">
            Go to Admins
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invite Admin</h1>
          <p className="text-muted-foreground mt-1">Send an invitation to a new admin user</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleInvite} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="newadmin@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Admin Role <span className="text-destructive">*</span>
              </label>
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-colors ${
                    role === "full_admin" ? "border-primary" : "hover:border-muted-foreground"
                  }`}
                  onClick={() => setRole("full_admin")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="full_admin"
                        checked={role === "full_admin"}
                        onChange={(e) => setRole(e.target.value as "full_admin")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">Full Admin</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Can manage everything and invite other admins
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-colors ${
                    role === "content_editor" ? "border-primary" : "hover:border-muted-foreground"
                  }`}
                  onClick={() => setRole("content_editor")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="content_editor"
                        checked={role === "content_editor"}
                        onChange={(e) => setRole(e.target.value as "content_editor")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          <span className="font-medium">Content Editor</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Limited access: packs, samples, creators. Cannot invite admins.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

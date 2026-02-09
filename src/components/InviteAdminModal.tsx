import { useState } from "react";
import { UserPlus, Loader2, CheckCircle, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface InviteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InviteAdminModal({ open, onOpenChange, onSuccess }: InviteAdminModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"full_admin" | "content_editor">("content_editor");
  const [message, setMessage] = useState("We're inviting you to help manage The Sample Lab admin.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

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

      // Get inviter info
      const { data: inviter } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", session.user.id)
        .single() as { data: { name: string | null; email: string } | null };

      // Check if user already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      if (existing) throw new Error("User with this email already exists");

      // Check if there's already a pending invite
      const { data: existingInvite } = await supabase
        .from("admin_invites")
        .select("id")
        .eq("email", email)
        .eq("used", false)
        .single();

      if (existingInvite) throw new Error("There is already a pending invite for this email");

      // Generate token and expiration
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invite record
      const { error: insertError } = await supabase
        .from("admin_invites")
        // @ts-expect-error - Database types may not be up to date
        .insert({
          email,
          role,
          invited_by: session.user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      // Generate invite link
      const link = `${window.location.origin}/login?token=${token}`;
      setInviteLink(link);

      // Send email via Edge Function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "send-invite-email",
          {
            body: {
              email,
              role,
              inviteLink: link,
              inviterName: inviter?.name || inviter?.email,
              message: message || undefined,
            },
          }
        );

        if (emailError) {
          console.error("Email sending error:", emailError);
          // Don't throw - invite is created, just email failed
          toast.warning("Invite created but email failed to send. Please share the link manually.");
        } else {
          console.log("Email sent successfully:", emailData);
        }
      } catch (emailErr) {
        console.error("Email exception:", emailErr);
        toast.warning("Invite created but email failed to send. Please share the link manually.");
      }

      toast.success("Invitation created successfully");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("content_editor");
    setMessage("We're inviting you to help manage The Sample Lab admin.");
    setError("");
    setInviteLink("");
    setLoading(false);
    onOpenChange(false);
  };

  // Success state - show invite link
  if (inviteLink) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <DialogTitle>Invitation Sent!</DialogTitle>
            </div>
            <DialogDescription>
              Share this link with the new admin. It will expire in 7 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1">{email}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Role</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {role === "full_admin" ? "Super Admin" : "Content Admin"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Invitation Link</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button onClick={copyToClipboard} size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                ✅ An email with the invitation link has been sent to <strong>{email}</strong>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Invite form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Admin
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new admin user. They'll receive an email with setup instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={role}
                onValueChange={(value: "full_admin" | "content_editor") => setRole(value)}
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_admin">Super Admin</SelectItem>
                  <SelectItem value="content_editor">Content Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === "full_admin" 
                  ? "Full access to all admin features including user management"
                  : "Can manage content but cannot invite or manage other admins"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Optional Message</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation email..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

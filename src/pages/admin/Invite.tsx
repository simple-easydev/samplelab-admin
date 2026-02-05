import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

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
            <h1 className="text-3xl font-bold text-gray-900">Invitation Sent!</h1>
            <p className="text-gray-600 mt-1">Share this link with the new admin</p>
          </div>
          <button onClick={() => navigate("/admin/users")} className="text-gray-600 hover:text-gray-800">
            ← Back to Users
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invited Email</label>
              <p className="text-lg text-gray-900">{email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  role === "full_admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {role === "full_admin" ? "Full Admin" : "Content Editor"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invitation Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Link
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Link expires in 7 days</p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                setEmail("");
                setInviteLink("");
                setRole("content_editor");
              }}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Invite Another Admin
            </button>
            <button
              onClick={() => navigate("/admin/users")}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Admin</h1>
          <p className="text-gray-600 mt-1">Send an invitation to a new admin user</p>
        </div>
        <button onClick={() => navigate("/admin/users")} className="text-gray-600 hover:text-gray-800">
          ← Back to Users
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <form onSubmit={handleInvite} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="newadmin@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Role <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="full_admin"
                  checked={role === "full_admin"}
                  onChange={(e) => setRole(e.target.value as "full_admin")}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Full Admin</span>
                  <p className="text-sm text-gray-600 mt-1">Can manage everything and invite other admins</p>
                </div>
              </label>
              <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="content_editor"
                  checked={role === "content_editor"}
                  onChange={(e) => setRole(e.target.value as "content_editor")}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Content Editor</span>
                  <p className="text-sm text-gray-600 mt-1">Limited access: packs, samples, creators. Cannot invite admins.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Sending Invitation..." : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}

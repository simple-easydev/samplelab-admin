"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteAdminPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"full_admin" | "content_editor">("content_editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteLink("");

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteLink(data.inviteLink);
    } catch (err: any) {
      setError(err.message);
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
          <button
            onClick={() => router.push("/admin/users")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Users
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invited Email
              </label>
              <p className="text-lg text-gray-900">{email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  role === "full_admin"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {role === "full_admin" ? "Full Admin" : "Content Editor"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation Link
              </label>
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

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The new admin will need to click this link to set up their
              account. Make sure to send it securely.
            </p>
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
              onClick={() => router.push("/admin/users")}
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
        <button
          onClick={() => router.push("/admin/users")}
          className="text-gray-600 hover:text-gray-800"
        >
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
            <p className="text-xs text-gray-500 mt-1">
              An invitation link will be sent to this email
            </p>
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Full Admin</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      All Access
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Can manage everything: packs, samples, creators, users, plans, billing, and
                    invite other admins
                  </p>
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Content Editor</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Limited Access
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Can manage: packs, samples, creators, and permissions. Cannot: see billing,
                    adjust credits, manage plans, or invite admins
                  </p>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Enter the email address of the person you want to invite</li>
          <li>Choose their admin role (Full Admin or Content Editor)</li>
          <li>Click "Send Invitation" to generate a secure invite link</li>
          <li>Share the link with the new admin (link expires in 7 days)</li>
          <li>They'll use the link to set up their account and password</li>
        </ol>
      </div>
    </div>
  );
}

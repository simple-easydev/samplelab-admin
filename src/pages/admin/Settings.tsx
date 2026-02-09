import { useState, useEffect } from "react";
import { Globe, FileText, Share2, CreditCard, Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface AppSettings {
  // General
  product_name: string;
  public_url: string;
  support_email: string;
  default_timezone: string;
  
  // Legal & Policies
  terms_of_service_url: string;
  privacy_policy_url: string;
  cookie_policy_url: string;
  
  // Social Links
  instagram_url: string;
  soundcloud_url: string;
  
  // Integrations
  stripe_status: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    product_name: "The Sample Lab",
    public_url: "https://lab.yoursite.com",
    support_email: "support@yourdomain.com",
    default_timezone: "UTC",
    terms_of_service_url: "",
    privacy_policy_url: "",
    cookie_policy_url: "",
    instagram_url: "",
    soundcloud_url: "",
    stripe_status: "Not Connected",
  });
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if there are any changes
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach((item: any) => {
          settingsMap[item.key] = item.value || "";
        });

        const loadedSettings = {
          product_name: settingsMap.product_name || "The Sample Lab",
          public_url: settingsMap.public_url || "https://lab.yoursite.com",
          support_email: settingsMap.support_email || "support@yourdomain.com",
          default_timezone: settingsMap.default_timezone || "UTC",
          terms_of_service_url: settingsMap.terms_of_service_url || "",
          privacy_policy_url: settingsMap.privacy_policy_url || "",
          cookie_policy_url: settingsMap.cookie_policy_url || "",
          instagram_url: settingsMap.instagram_url || "",
          soundcloud_url: settingsMap.soundcloud_url || "",
          stripe_status: settingsMap.stripe_status || "Not Connected",
        };

        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not authenticated");

      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value || "",
        updated_by: session.user.id,
      }));

      for (const update of updates) {
        // Skip stripe_status as it's read-only
        if (update.key === "stripe_status") continue;

        const { error } = await supabase
          .from("app_settings")
          // @ts-expect-error - Supabase generated types may be out of sync
          .update({
            value: update.value,
            updated_by: update.updated_by,
            updated_at: new Date().toISOString(),
          })
          .eq("key", update.key);

        if (error) throw error;
      }

      setOriginalSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    toast.info("Changes discarded");
  };

  const handleChange = (key: keyof AppSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure application settings and preferences
          </p>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Click <strong>Save Changes</strong> to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>
            Basic application information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={settings.product_name}
              onChange={(e) => handleChange("product_name", e.target.value)}
              placeholder="The Sample Lab"
            />
            <p className="text-xs text-muted-foreground">
              Used in titles, emails, and UI labels
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_url">Public URL</Label>
            <Input
              id="public_url"
              type="url"
              value={settings.public_url}
              onChange={(e) => handleChange("public_url", e.target.value)}
              placeholder="https://lab.yoursite.com"
            />
            <p className="text-xs text-muted-foreground">
              Used in emails and redirect links
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              value={settings.support_email}
              onChange={(e) => handleChange("support_email", e.target.value)}
              placeholder="support@yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              Shown in Help Center, footer, and transactional emails
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_timezone">Default Time Zone</Label>
            <Input
              id="default_timezone"
              value={settings.default_timezone}
              onChange={(e) => handleChange("default_timezone", e.target.value)}
              placeholder="UTC"
            />
            <p className="text-xs text-muted-foreground">
              Used for dates in admin stats (e.g., "last 30 days")
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal & Policies
          </CardTitle>
          <CardDescription>
            Links to legal documents (used in footer and sign-up screens)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
            <Input
              id="terms_of_service_url"
              type="url"
              value={settings.terms_of_service_url}
              onChange={(e) => handleChange("terms_of_service_url", e.target.value)}
              placeholder="https://notion.so/your-terms"
            />
            <p className="text-xs text-muted-foreground">
              Notion link or external page
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
            <Input
              id="privacy_policy_url"
              type="url"
              value={settings.privacy_policy_url}
              onChange={(e) => handleChange("privacy_policy_url", e.target.value)}
              placeholder="https://notion.so/your-privacy-policy"
            />
            <p className="text-xs text-muted-foreground">
              Notion link or external page
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cookie_policy_url">Cookie Policy URL (Optional)</Label>
            <Input
              id="cookie_policy_url"
              type="url"
              value={settings.cookie_policy_url}
              onChange={(e) => handleChange("cookie_policy_url", e.target.value)}
              placeholder="https://notion.so/your-cookie-policy"
            />
            <p className="text-xs text-muted-foreground">
              Notion link or external page
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Links
          </CardTitle>
          <CardDescription>
            Social media URLs (used in footer and promotional materials)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram_url">Instagram URL</Label>
            <Input
              id="instagram_url"
              type="url"
              value={settings.instagram_url}
              onChange={(e) => handleChange("instagram_url", e.target.value)}
              placeholder="https://instagram.com/yourbrand"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="soundcloud_url">SoundCloud URL</Label>
            <Input
              id="soundcloud_url"
              type="url"
              value={settings.soundcloud_url}
              onChange={(e) => handleChange("soundcloud_url", e.target.value)}
              placeholder="https://soundcloud.com/yourbrand"
            />
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Third-party service integrations (read-only in current version)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">Stripe Payment Gateway</p>
              <p className="text-xs text-muted-foreground">
                Payment processing and subscription management
              </p>
            </div>
            <Badge variant={settings.stripe_status === "Connected" ? "default" : "secondary"}>
              {settings.stripe_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 sticky bottom-6 bg-background p-4 border rounded-lg shadow-lg">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || saving}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

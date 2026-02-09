import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { Banner } from "@/types";

interface EditBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bannerId: string, updates: {
    headline: string;
    message: string;
    ctaLabel: string;
    ctaUrl: string;
    audience: string;
    active: boolean;
  }) => Promise<void>;
  banner: Banner | null;
  hasOtherActiveBanner: boolean;
}

export default function EditBannerModal({
  isOpen,
  onClose,
  onSuccess,
  banner,
  hasOtherActiveBanner,
}: EditBannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audience, setAudience] = useState<string>("all");

  // Load banner data when modal opens
  useEffect(() => {
    if (banner && isOpen) {
      setHeadline(banner.headline);
      setMessage(banner.message);
      setCtaLabel(banner.cta_label || "");
      setCtaUrl(banner.cta_url || "");
      setAudience(banner.audience);
      setActive(banner.active);
    }
  }, [banner, isOpen]);

  const handleSave = async () => {
    if (!banner) return;

    // Validation
    if (!headline.trim()) {
      toast.error("Headline is required");
      return;
    }

    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    if (ctaLabel.trim() && !ctaUrl.trim()) {
      toast.error("CTA URL is required when CTA label is provided");
      return;
    }

    if (ctaUrl.trim() && !ctaLabel.trim()) {
      toast.error("CTA label is required when CTA URL is provided");
      return;
    }

    // Validate URL format if provided
    if (ctaUrl.trim()) {
      try {
        new URL(ctaUrl);
      } catch {
        toast.error("Please enter a valid URL (e.g., https://example.com)");
        return;
      }
    }

    setLoading(true);

    try {
      await onSuccess(banner.id, {
        headline: headline.trim(),
        message: message.trim(),
        ctaLabel: ctaLabel.trim(),
        ctaUrl: ctaUrl.trim(),
        audience,
        active,
      });

      toast.success("Banner updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Error updating banner:", error);
      toast.error(error?.message || "Failed to update banner");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Check if trying to activate when another is active
  const cannotActivate = !banner?.active && active && hasOtherActiveBanner;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogDescription>
            Update banner announcement details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {hasOtherActiveBanner && !banner?.active
                    ? "Another banner is already active. Turn it off first to activate this one."
                    : "Enable to make this banner visible to users"}
                </p>
              </div>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
                disabled={hasOtherActiveBanner && !banner?.active}
              />
            </div>
            
            {cannotActivate && (
              <Alert>
                <AlertDescription>
                  Only one banner can be active at a time. Please deactivate the current banner before activating this one.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">
              Headline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., New Sample Packs Available"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {headline.length}/100 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the banner message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          {/* CTA Label */}
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">CTA Label (Optional)</Label>
            <Input
              id="ctaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="e.g., Learn More, Shop Now, Get Started"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Button text for call-to-action
            </p>
          </div>

          {/* CTA URL */}
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">CTA URL (Optional)</Label>
            <Input
              id="ctaUrl"
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://example.com/page"
            />
            <p className="text-xs text-muted-foreground">
              Where the CTA button should link to
            </p>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id="audience">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visitors</SelectItem>
                <SelectItem value="logged-in">Logged-in Users Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Who should see this banner
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

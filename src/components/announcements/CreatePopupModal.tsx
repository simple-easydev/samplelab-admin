import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CreatePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPopup: {
    title: string;
    message: string;
    ctaLabel: string;
    ctaUrl: string;
    audience: string;
    frequency: string;
    active: boolean;
  }) => Promise<void>;
  hasActivePopup: boolean;
}

export default function CreatePopupModal({
  isOpen,
  onClose,
  onSuccess,
  hasActivePopup,
}: CreatePopupModalProps) {
  const [formData, setFormData] = useState({
    active: false,
    title: "",
    message: "",
    ctaLabel: "",
    ctaUrl: "",
    audience: "all",
    frequency: "once",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Message is required");
      return;
    }

    // CTA validation: both label and URL must be provided or both empty
    const hasCtaLabel = formData.ctaLabel.trim().length > 0;
    const hasCtaUrl = formData.ctaUrl.trim().length > 0;

    if (hasCtaLabel !== hasCtaUrl) {
      toast.error("Both CTA label and URL are required if you want to add a call-to-action");
      return;
    }

    // URL format validation if CTA is provided
    if (hasCtaUrl) {
      try {
        new URL(formData.ctaUrl);
      } catch {
        toast.error("Please enter a valid URL for the CTA (e.g., https://example.com)");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSuccess({
        title: formData.title.trim(),
        message: formData.message.trim(),
        ctaLabel: formData.ctaLabel.trim(),
        ctaUrl: formData.ctaUrl.trim(),
        audience: formData.audience,
        frequency: formData.frequency,
        active: formData.active,
      });

      // Reset form and close
      setFormData({
        active: false,
        title: "",
        message: "",
        ctaLabel: "",
        ctaUrl: "",
        audience: "all",
        frequency: "once",
      });
      onClose();
      toast.success("Pop-up created successfully");
    } catch (error: any) {
      console.error("Error creating popup:", error);
      toast.error(error.message || "Failed to create pop-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        active: false,
        title: "",
        message: "",
        ctaLabel: "",
        ctaUrl: "",
        audience: "all",
        frequency: "once",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pop-up</DialogTitle>
          <DialogDescription>
            Create a new pop-up announcement that will appear as a modal to users.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Status</Label>
              <p className="text-sm text-muted-foreground">
                Make this pop-up active immediately
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
              disabled={hasActivePopup}
            />
          </div>

          {hasActivePopup && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
              Another pop-up is currently active. Please deactivate it first before
              activating this one.
            </p>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter pop-up title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Enter the main message for this pop-up"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={4}
              maxLength={500}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* CTA Label */}
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">CTA Label (Optional)</Label>
            <Input
              id="ctaLabel"
              placeholder="e.g., Learn More, Get Started"
              value={formData.ctaLabel}
              onChange={(e) =>
                setFormData({ ...formData, ctaLabel: e.target.value })
              }
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Button text for the call-to-action
            </p>
          </div>

          {/* CTA URL */}
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">CTA URL (Optional)</Label>
            <Input
              id="ctaUrl"
              type="url"
              placeholder="https://example.com"
              value={formData.ctaUrl}
              onChange={(e) =>
                setFormData({ ...formData, ctaUrl: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              URL to navigate when the CTA button is clicked
            </p>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) =>
                setFormData({ ...formData, audience: value })
              }
            >
              <SelectTrigger id="audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All logged-in users</SelectItem>
                <SelectItem value="subscribers">Subscribers only</SelectItem>
                <SelectItem value="trial">Trial users</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose who will see this pop-up
            </p>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Display Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency: value })
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Show once per user</SelectItem>
                <SelectItem value="until-dismissed">Until dismissed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Control how often users see this pop-up
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save Pop-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

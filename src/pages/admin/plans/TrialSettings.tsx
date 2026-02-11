import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  Loader2,
  AlertCircle,
  Save,
  RotateCcw,
  Calendar,
  Gift,
  Lock,
  Info,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TrialSettingsState {
  duration_days: number;
  trial_credits: number;
  limit_premium_during_trial: boolean;
}

const DEFAULT_SETTINGS: TrialSettingsState = {
  duration_days: 3,
  trial_credits: 10,
  limit_premium_during_trial: true,
};

export default function TrialSettingsPage() {
  const [settings, setSettings] = useState<TrialSettingsState>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<TrialSettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const changed =
      settings.duration_days !== originalSettings.duration_days ||
      settings.trial_credits !== originalSettings.trial_credits ||
      settings.limit_premium_during_trial !== originalSettings.limit_premium_during_trial;
    setHasChanges(changed);
  }, [settings, originalSettings]);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual database query
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockSettings: TrialSettingsState = {
        duration_days: 3,
        trial_credits: 10,
        limit_premium_during_trial: true,
      };

      setSettings(mockSettings);
      setOriginalSettings(mockSettings);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching trial settings:", err);
      setError("Failed to load trial settings: " + message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    if (settings.duration_days < 1 || settings.duration_days > 365) {
      toast.error("Trial duration must be between 1 and 365 days");
      return;
    }
    if (settings.trial_credits < 0) {
      toast.error("Trial credits cannot be negative");
      return;
    }

    try {
      setIsSaving(true);

      // TODO: Add database update logic
      await new Promise((resolve) => setTimeout(resolve, 500));

      setOriginalSettings(settings);
      toast.success("Trial settings updated successfully", {
        description: "New users will receive these trial benefits.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error saving trial settings:", err);
      toast.error("Failed to save trial settings: " + message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    toast.info("Changes discarded");
  };

  const handleResetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    try {
      setIsSaving(true);

      // TODO: Add database update logic
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
      setShowResetDialog(false);
      toast.success("Trial settings reset to defaults");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error resetting trial settings:", err);
      toast.error("Failed to reset trial settings: " + message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trial Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure trial duration, credits, and limitations for new accounts.
        </p>
      </div>

      {/* Information section (read-only) */}
      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Info className="h-4 w-4" />
            How trials work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Trial applies to all new accounts.</p>
          <p>• Trial can be changed anytime — future users see updated settings; existing trials stay unaffected.</p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trial configuration
              </CardTitle>
              <CardDescription>
                Set trial duration, credits, and content limitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration_days" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Trial duration
                  </Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="3"
                    value={settings.duration_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        duration_days: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days (e.g. 3 days)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trial_credits" className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    Trial credits
                  </Label>
                  <Input
                    id="trial_credits"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={settings.trial_credits}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        trial_credits: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How many credits a trial user gets immediately after sign-up
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="limit_premium" className="flex items-center gap-2 text-base">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Limit premium content during trial
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    If ON, trial users cannot download premium packs/samples — they see a soft-nag: &quot;Upgrade to access premium content&quot;.
                  </p>
                </div>
                <Switch
                  id="limit_premium"
                  checked={settings.limit_premium_during_trial}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, limit_premium_during_trial: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to default
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click &quot;Save changes&quot; to apply them or &quot;Cancel&quot; to discard.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all trial settings to their default values (3 days, 10 credits, limit premium content ON). Save to apply.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  Save,
  X,
  RotateCcw,
  Music,
  Disc3,
  Layers,
  Package
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

interface CreditRules {
  loops_compositions: number;
  one_shots: number;
  stems: number;
  full_pack_download: number;
  allow_pack_overrides: boolean;
}

const DEFAULT_RULES: CreditRules = {
  loops_compositions: 2,
  one_shots: 1,
  stems: 5,
  full_pack_download: 8,
  allow_pack_overrides: true,
};

export default function CreditRulesPage() {
  const [rules, setRules] = useState<CreditRules>(DEFAULT_RULES);
  const [originalRules, setOriginalRules] = useState<CreditRules>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Fetch current rules from database
  useEffect(() => {
    fetchRules();
  }, []);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = 
      rules.loops_compositions !== originalRules.loops_compositions ||
      rules.one_shots !== originalRules.one_shots ||
      rules.stems !== originalRules.stems ||
      rules.full_pack_download !== originalRules.full_pack_download ||
      rules.allow_pack_overrides !== originalRules.allow_pack_overrides;
    setHasChanges(changed);
  }, [rules, originalRules]);

  async function fetchRules() {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual database query
      // const { data, error } = await supabase
      //   .from("credit_rules")
      //   .select("*")
      //   .single();

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, using mock data
      const mockRules: CreditRules = {
        loops_compositions: 2,
        one_shots: 1,
        stems: 5,
        full_pack_download: 8,
        allow_pack_overrides: true,
      };

      setRules(mockRules);
      setOriginalRules(mockRules);
    } catch (err: any) {
      console.error("Error fetching credit rules:", err);
      setError("Failed to load credit rules: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    // Validation
    if (rules.loops_compositions < 0 || rules.one_shots < 0 || rules.stems < 0 || rules.full_pack_download < 0) {
      toast.error("Credit values cannot be negative");
      return;
    }

    try {
      setIsSaving(true);

      // TODO: Add database update logic
      // const { error } = await supabase
      //   .from("credit_rules")
      //   .update(rules)
      //   .eq("id", "default");

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setOriginalRules(rules);
      toast.success("Credit rules updated successfully", {
        description: "New rules will apply to all newly uploaded content.",
      });
    } catch (err: any) {
      console.error("Error saving credit rules:", err);
      toast.error("Failed to save credit rules: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setRules(originalRules);
    toast.info("Changes discarded");
  };

  const handleResetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    try {
      setIsSaving(true);

      // TODO: Add database update logic
      // const { error } = await supabase
      //   .from("credit_rules")
      //   .update(DEFAULT_RULES)
      //   .eq("id", "default");

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRules(DEFAULT_RULES);
      setOriginalRules(DEFAULT_RULES);
      setShowResetDialog(false);
      toast.success("Credit rules reset to defaults");
    } catch (err: any) {
      console.error("Error resetting credit rules:", err);
      toast.error("Failed to reset credit rules: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Credit Rules</h1>
        <p className="text-muted-foreground mt-1">
          Set default credit costs for each content type. These values apply to all newly uploaded content unless overridden at the pack level.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Regular Content Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Regular Content
              </CardTitle>
              <CardDescription>
                Default credit costs for standard content types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Loops / Compositions */}
                <div className="space-y-2">
                  <Label htmlFor="loops_compositions" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    Loops / Compositions
                  </Label>
                  <Input
                    id="loops_compositions"
                    type="number"
                    min="0"
                    placeholder="2"
                    value={rules.loops_compositions}
                    onChange={(e) =>
                      setRules({ ...rules, loops_compositions: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Credit cost for loop and composition samples
                  </p>
                </div>

                {/* One-shots */}
                <div className="space-y-2">
                  <Label htmlFor="one_shots" className="flex items-center gap-2">
                    <Disc3 className="h-4 w-4 text-muted-foreground" />
                    One-shots
                  </Label>
                  <Input
                    id="one_shots"
                    type="number"
                    min="0"
                    placeholder="1"
                    value={rules.one_shots}
                    onChange={(e) =>
                      setRules({ ...rules, one_shots: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Credit cost for one-shot samples
                  </p>
                </div>

                {/* Stems */}
                <div className="space-y-2">
                  <Label htmlFor="stems" className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Stems
                  </Label>
                  <Input
                    id="stems"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={rules.stems}
                    onChange={(e) =>
                      setRules({ ...rules, stems: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional credit cost for stem bundles
                  </p>
                </div>

                {/* Full Pack Download */}
                <div className="space-y-2">
                  <Label htmlFor="full_pack_download" className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Full Pack Download
                  </Label>
                  <Input
                    id="full_pack_download"
                    type="number"
                    min="0"
                    placeholder="8"
                    value={rules.full_pack_download}
                    onChange={(e) =>
                      setRules({ ...rules, full_pack_download: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Credit cost for downloading entire pack
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pack Overrides Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pack-Level Overrides</CardTitle>
              <CardDescription>
                Control whether admins can set custom credit costs for individual packs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="allow_pack_overrides" className="cursor-pointer font-medium">
                    Allow per-pack overrides
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Lets admins set unique credit costs in the pack editor
                  </p>
                </div>
                <Switch
                  id="allow_pack_overrides"
                  checked={rules.allow_pack_overrides}
                  onCheckedChange={(checked) =>
                    setRules({ ...rules, allow_pack_overrides: checked })
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
              Reset to Defaults
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
                    Save Changes
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
                You have unsaved changes. Click "Save Changes" to apply them or "Cancel" to discard.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Values?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all credit rules to their default values:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Loops / Compositions: 2 credits</li>
                <li>One-shots: 1 credit</li>
                <li>Stems: 5 credits</li>
                <li>Full Pack Download: 8 credits</li>
                <li>Allow per-pack overrides: Enabled</li>
              </ul>
              <p className="mt-2">This action will apply immediately and affect all newly uploaded content.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset to Defaults"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

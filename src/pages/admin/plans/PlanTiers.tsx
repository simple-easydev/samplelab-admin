import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  Coins,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface PlanTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  credits_monthly: number;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  name: string;
  display_name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  credits_monthly: string;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
  sort_order: string;
}

const EMPTY_FORM: PlanFormData = {
  name: "",
  display_name: "",
  description: "",
  price_monthly: "0",
  price_yearly: "0",
  credits_monthly: "0",
  is_popular: false,
  is_active: true,
  features: [],
  sort_order: "0",
};

export default function PlanTiersPage() {
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanTier | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(EMPTY_FORM);
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch plans from database
  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual database query when plan_tiers table exists
      // For now, using mock data
      const mockPlans: PlanTier[] = [
        {
          id: "1",
          name: "free",
          display_name: "Free",
          description: "Perfect for trying out the platform",
          price_monthly: 0,
          price_yearly: 0,
          credits_monthly: 25,
          is_popular: false,
          is_active: true,
          features: ["25 credits/month", "Basic sample library", "Standard quality", "Community support"],
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "starter",
          display_name: "Starter",
          description: "For hobbyists and beginners",
          price_monthly: 9.99,
          price_yearly: 99,
          credits_monthly: 100,
          is_popular: false,
          is_active: true,
          features: ["100 credits/month", "Full sample library", "HD quality", "Email support", "No watermarks"],
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "pro",
          display_name: "Pro",
          description: "Most popular for serious producers",
          price_monthly: 19.99,
          price_yearly: 199,
          credits_monthly: 250,
          is_popular: true,
          is_active: true,
          features: ["250 credits/month", "Full sample library", "Premium samples", "Priority support", "Stems included", "Early access"],
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "elite",
          display_name: "Elite",
          description: "For professionals and studios",
          price_monthly: 39.99,
          price_yearly: 399,
          credits_monthly: 600,
          is_popular: false,
          is_active: true,
          features: ["600 credits/month", "Unlimited library access", "All premium samples", "24/7 priority support", "All stems included", "Early access", "Custom licensing"],
          sort_order: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setPlans(mockPlans);
    } catch (err: any) {
      console.error("Error fetching plans:", err);
      setError("Failed to load plan tiers: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter plans
  const filteredPlans = plans
    .filter((plan) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          plan.name.toLowerCase().includes(query) ||
          plan.display_name.toLowerCase().includes(query) ||
          plan.description?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  // Handle Add Plan
  const handleAddPlan = () => {
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  // Handle Edit Plan
  const handleEditPlan = (plan: PlanTier) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || "",
      price_monthly: plan.price_monthly.toString(),
      price_yearly: plan.price_yearly.toString(),
      credits_monthly: plan.credits_monthly.toString(),
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      features: [...plan.features],
      sort_order: plan.sort_order.toString(),
    });
    setShowEditModal(true);
  };

  // Handle Delete Plan
  const handleDeletePlan = (plan: PlanTier) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      setIsDeleting(true);

      // TODO: Add database delete logic
      // const { error } = await supabase
      //   .from("plan_tiers")
      //   .delete()
      //   .eq("id", selectedPlan.id);

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPlans(plans.filter((p) => p.id !== selectedPlan.id));
      toast.success("Plan deleted successfully");
      setShowDeleteDialog(false);
      setSelectedPlan(null);
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      toast.error("Failed to delete plan: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Save Plan (Add or Edit)
  const handleSavePlan = async () => {
    // Validation for edit modal - only credits are required
    if (editingPlan) {
      if (!formData.credits_monthly.trim() || parseInt(formData.credits_monthly) < 0) {
        toast.error("Valid monthly credits value is required");
        return;
      }
    } else {
      // Validation for add modal
      if (!formData.name.trim()) {
        toast.error("Plan name is required");
        return;
      }
      if (!formData.display_name.trim()) {
        toast.error("Display name is required");
        return;
      }
    }

    try {
      setIsSaving(true);

      if (editingPlan) {
        // Update existing plan - only editable fields
        const planData = {
          credits_monthly: parseInt(formData.credits_monthly) || 0,
          is_popular: formData.is_popular,
        };

        // TODO: Add database update logic
        // const { error } = await supabase
        //   .from("plan_tiers")
        //   .update(planData)
        //   .eq("id", editingPlan.id);

        // if (error) throw error;

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // If setting this plan as popular, remove popular from all others
        const updatedPlans = plans.map((p) => {
          if (p.id === editingPlan.id) {
            return { ...p, ...planData, updated_at: new Date().toISOString() };
          } else if (formData.is_popular && p.is_popular) {
            // If we're setting a new popular plan, remove popular from others
            return { ...p, is_popular: false, updated_at: new Date().toISOString() };
          }
          return p;
        });

        setPlans(updatedPlans);
        toast.success("Plan updated successfully");
        setShowEditModal(false);
      } else {
        // Create new plan - full data
        const planData = {
          name: formData.name.toLowerCase().replace(/\s+/g, "_"),
          display_name: formData.display_name,
          description: formData.description || null,
          price_monthly: parseFloat(formData.price_monthly) || 0,
          price_yearly: parseFloat(formData.price_yearly) || 0,
          credits_monthly: parseInt(formData.credits_monthly) || 0,
          is_popular: formData.is_popular,
          is_active: formData.is_active,
          features: formData.features,
          sort_order: parseInt(formData.sort_order) || 0,
        };
        // Create new plan
        // TODO: Add database insert logic
        // const { data, error } = await supabase
        //   .from("plan_tiers")
        //   .insert(planData)
        //   .select()
        //   .single();

        // if (error) throw error;

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newPlan: PlanTier = {
          id: Date.now().toString(),
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setPlans([...plans, newPlan]);
        toast.success("Plan created successfully");
        setShowAddModal(false);
      }

      setEditingPlan(null);
    } catch (err: any) {
      console.error("Error saving plan:", err);
      toast.error("Failed to save plan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle add feature
  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  // Handle remove feature
  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  // Format currency
  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  // Calculate yearly discount percentage
  const calculateYearlyDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0 || yearlyPrice === 0) return 0;
    const monthlyTotal = monthlyPrice * 12;
    const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  // Toggle popular status
  const togglePopular = async (plan: PlanTier) => {
    try {
      // TODO: Add database update logic
      // const { error } = await supabase
      //   .from("plan_tiers")
      //   .update({ is_popular: !plan.is_popular })
      //   .eq("id", plan.id);

      // if (error) throw error;

      // If setting this plan as popular, remove popular from all others
      const updatedPlans = plans.map((p) => {
        if (p.id === plan.id) {
          return { ...p, is_popular: !p.is_popular, updated_at: new Date().toISOString() };
        } else if (!plan.is_popular) {
          // If we're setting a new popular plan, remove popular from others
          return { ...p, is_popular: false, updated_at: new Date().toISOString() };
        }
        return p;
      });

      setPlans(updatedPlans);
      toast.success(
        plan.is_popular
          ? "Removed from popular plans"
          : "Marked as most popular"
      );
    } catch (err: any) {
      console.error("Error updating plan:", err);
      toast.error("Failed to update plan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Plan Tiers</h1>
        <p className="text-muted-foreground mt-1">
          Manage subscription plans and pricing tiers
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Subscription Plans ({filteredPlans.length})
            </CardTitle>
            <Button onClick={handleAddPlan}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plans found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by creating your first plan tier"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddPlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Monthly Price</TableHead>
                  <TableHead>Yearly Price</TableHead>
                  <TableHead>Yearly Discount</TableHead>
                  <TableHead>Monthly Credits</TableHead>
                  <TableHead>Most Popular</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.display_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(plan.price_monthly)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(plan.price_yearly)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.price_monthly > 0 && plan.price_yearly > 0 ? (
                        <Badge variant="secondary">
                          {calculateYearlyDiscount(plan.price_monthly, plan.price_yearly)}% off
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">
                          {plan.credits_monthly}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={plan.is_popular ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePopular(plan)}
                      >
                        {plan.is_popular ? (
                          <>
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Popular
                          </>
                        ) : (
                          "Set Popular"
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePlan(plan)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Plan Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan tier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Plan ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., starter, pro, elite"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, no spaces (used in database)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Starter, Pro, Elite"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this plan..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="9.99"
                  value={formData.price_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, price_monthly: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="99.00"
                  value={formData.price_yearly}
                  onChange={(e) =>
                    setFormData({ ...formData, price_yearly: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits_monthly">Monthly Credits</Label>
                <Input
                  id="credits_monthly"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.credits_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, credits_monthly: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={feature} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddFeature}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="is_popular" className="cursor-pointer">
                  Mark as Popular
                </Label>
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_popular: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active Plan
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                placeholder="0"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan credits and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Plan Info Section (Read-only) */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Plan Info</h4>
              </div>
              
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  value={formData.display_name}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price</Label>
                  <Input
                    value={formatPrice(parseFloat(formData.price_monthly)) + " / month"}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price</Label>
                  <Input
                    value={formatPrice(parseFloat(formData.price_yearly)) + " / year"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Price is managed in Stripe. Contact dev if you need to change it.
                </AlertDescription>
              </Alert>
            </div>

            {/* Editable Business Fields */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-semibold mb-3">Editable Settings</h4>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_credits_monthly">
                  Monthly Credits <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_credits_monthly"
                  type="number"
                  min="0"
                  placeholder="e.g., 30, 60, 120"
                  value={formData.credits_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, credits_monthly: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of credits added to user's balance every billing cycle.
                </p>
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Note:</strong> Changes affect future renewals and new subscribers only. 
                    Current cycle credits remain unchanged; new value applies from the next billing cycle.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="edit_is_popular" className="cursor-pointer font-medium">
                    Most Popular Badge
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only one plan can be "Most popular" at a time
                  </p>
                </div>
                <Switch
                  id="edit_is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_popular: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan Tier?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedPlan?.display_name}</strong>?
              This action cannot be undone. Existing customers on this plan will not be
              affected, but new subscriptions will be unavailable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

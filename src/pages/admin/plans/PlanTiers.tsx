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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/lib/supabase";

interface PlanTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  billing_cycle: string;
  price: number;
  original_price: number | null;
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
  billing_cycle: string;
  price: string;
  original_price: string;
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
  billing_cycle: "month",
  price: "0",
  original_price: "",
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

      const { data, error: fetchError } = await supabase
        .from("plan_tiers")
        .select("*")
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;

      type PlanTierRow = {
        id: string;
        name: string;
        display_name: string;
        description: string | null;
        billing_cycle: string;
        price: number;
        original_price: number | null;
        credits_monthly: number;
        is_popular: boolean;
        is_active: boolean;
        features: string[];
        sort_order: number;
        created_at: string;
        updated_at: string;
      };

      const mapped: PlanTier[] = ((data ?? []) as PlanTierRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        display_name: row.display_name,
        description: row.description ?? null,
        billing_cycle: row.billing_cycle ?? "month",
        price: Number(row.price),
        original_price: row.original_price != null ? Number(row.original_price) : null,
        credits_monthly: row.credits_monthly ?? 0,
        is_popular: row.is_popular ?? false,
        is_active: row.is_active ?? true,
        features: Array.isArray(row.features) ? row.features : [],
        sort_order: row.sort_order ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setPlans(mapped);
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
    setEditingPlan(null);
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  // Handle Edit Plan
  const handleEditPlan = (plan: PlanTier) => {
    setEditingPlan(plan);
    setFeatureInput("");
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || "",
      billing_cycle: plan.billing_cycle || "month",
      price: plan.price.toString(),
      original_price: plan.original_price != null ? plan.original_price.toString() : "",
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

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error("You must be signed in to delete a plan");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-plan-tier", {
        body: { id: selectedPlan.id },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      const payload = data as { error?: string } | null;
      if (payload?.error) throw new Error(payload.error);

      setPlans((prev) => prev.filter((p) => p.id !== selectedPlan.id));
      toast.success("Plan deleted successfully");
      setShowDeleteDialog(false);
      setSelectedPlan(null);
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      toast.error("Failed to delete plan: " + (err?.message ?? ""));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Save Plan (Add or Edit)
  const handleSavePlan = async () => {
    // Validation for edit modal
    if (editingPlan) {
      if (!formData.display_name.trim()) {
        toast.error("Display name is required");
        return;
      }
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Price must be 0 or greater");
        return;
      }
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
        // Update existing plan via Edge Function
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) {
          toast.error("You must be signed in to update a plan");
          return;
        }

        const updateBody = {
          id: editingPlan.id,
          display_name: formData.display_name,
          description: formData.description || null,
          billing_cycle: formData.billing_cycle || "month",
          price: parseFloat(formData.price) || 0,
          original_price: formData.original_price.trim() !== "" ? parseFloat(formData.original_price) : null,
          credits_monthly: parseInt(formData.credits_monthly) || 0,
          is_popular: formData.is_popular,
          is_active: formData.is_active,
          features: formData.features,
          sort_order: parseInt(formData.sort_order) || 0,
        };

        const { data, error } = await supabase.functions.invoke("update-plan-tier", {
          body: updateBody,
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (error) throw error;

        const payload = data as { error?: string; plan?: Record<string, unknown> } | null;
        if (payload?.error) throw new Error(payload.error);
        if (!payload?.plan) throw new Error("No plan returned");

        const row = payload.plan as {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          billing_cycle: string;
          price: number;
          original_price: number | null;
          credits_monthly: number;
          is_popular: boolean;
          is_active: boolean;
          features: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };

        const updatedPlan: PlanTier = {
          id: row.id,
          name: row.name,
          display_name: row.display_name,
          description: row.description ?? null,
          billing_cycle: row.billing_cycle ?? "month",
          price: Number(row.price),
          original_price: row.original_price != null ? Number(row.original_price) : null,
          credits_monthly: row.credits_monthly ?? 0,
          is_popular: row.is_popular ?? false,
          is_active: row.is_active ?? true,
          features: Array.isArray(row.features) ? row.features : [],
          sort_order: row.sort_order ?? 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        setPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? updatedPlan : p))
        );
        toast.success("Plan updated successfully");
        setShowEditModal(false);
      } else {
        // Create new plan via Edge Function
        const planData = {
          name: formData.name.toLowerCase().replace(/\s+/g, "_"),
          display_name: formData.display_name,
          description: formData.description || null,
          billing_cycle: formData.billing_cycle || "month",
          price: parseFloat(formData.price) || 0,
          original_price: formData.original_price.trim() !== "" ? parseFloat(formData.original_price) : null,
          credits_monthly: parseInt(formData.credits_monthly) || 0,
          is_popular: formData.is_popular,
          is_active: formData.is_active,
          features: formData.features,
          sort_order: parseInt(formData.sort_order) || 0,
        };

        // Use current session (client auto-attaches Authorization when present)
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) {
          toast.error("You must be signed in to create a plan");
          return;
        }

        const { data, error } = await supabase.functions.invoke("create-plan-tier", {
          body: planData,
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (error) throw error;

        const payload = data as { error?: string; plan?: Record<string, unknown> } | null;
        if (payload?.error) throw new Error(payload.error);
        if (!payload?.plan) throw new Error("No plan returned");

        const row = payload.plan as {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          billing_cycle: string;
          price: number;
          original_price: number | null;
          credits_monthly: number;
          is_popular: boolean;
          is_active: boolean;
          features: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };

        const newPlan: PlanTier = {
          id: row.id,
          name: row.name,
          display_name: row.display_name,
          description: row.description ?? null,
          billing_cycle: row.billing_cycle ?? "month",
          price: Number(row.price),
          original_price: row.original_price != null ? Number(row.original_price) : null,
          credits_monthly: row.credits_monthly ?? 0,
          is_popular: row.is_popular ?? false,
          is_active: row.is_active ?? true,
          features: Array.isArray(row.features) ? row.features : [],
          sort_order: row.sort_order ?? 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
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

  const billingCycleLabel = (cycle: string) =>
    cycle === "year" ? "Per year" : "Per month";

  // Toggle popular status (persists via update-plan-tier)
  const togglePopular = async (plan: PlanTier) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error("You must be signed in to update a plan");
        return;
      }

      const newPopular = !plan.is_popular;
      const authHeader = {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      };

      // If setting this plan as popular, clear is_popular on all others first
      if (newPopular) {
        const othersPopular = plans.filter((p) => p.id !== plan.id && p.is_popular);
        for (const p of othersPopular) {
          const { data, error } = await supabase.functions.invoke("update-plan-tier", {
            body: { id: p.id, is_popular: false },
            headers: authHeader,
          });
          if (error) throw error;
          const payload = data as { error?: string; plan?: Record<string, unknown> } | null;
          if (payload?.error) throw new Error(payload.error);
        }
      }

      const { data, error } = await supabase.functions.invoke("update-plan-tier", {
        body: { id: plan.id, is_popular: newPopular },
        headers: authHeader,
      });

      if (error) throw error;

      const payload = data as { error?: string; plan?: Record<string, unknown> } | null;
      if (payload?.error) throw new Error(payload.error);
      if (!payload?.plan) throw new Error("No plan returned");

      const row = payload.plan as {
        id: string;
        name: string;
        display_name: string;
        description: string | null;
        billing_cycle: string;
        price: number;
        original_price: number | null;
        credits_monthly: number;
        is_popular: boolean;
        is_active: boolean;
        features: string[];
        sort_order: number;
        created_at: string;
        updated_at: string;
      };

      const updatedPlan: PlanTier = {
        id: row.id,
        name: row.name,
        display_name: row.display_name,
        description: row.description ?? null,
        billing_cycle: row.billing_cycle ?? "month",
        price: Number(row.price),
        original_price: row.original_price != null ? Number(row.original_price) : null,
        credits_monthly: row.credits_monthly ?? 0,
        is_popular: row.is_popular ?? false,
        is_active: row.is_active ?? true,
        features: Array.isArray(row.features) ? row.features : [],
        sort_order: row.sort_order ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? updatedPlan : newPopular ? { ...p, is_popular: false } : p))
      );
      toast.success(
        newPopular ? "Marked as most popular" : "Removed from popular plans"
      );
    } catch (err: any) {
      console.error("Error updating plan:", err);
      toast.error("Failed to update plan: " + (err?.message ?? ""));
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
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
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
                        {plan.original_price != null && plan.original_price > plan.price && (
                          <span className="text-muted-foreground line-through mr-2">
                            {formatPrice(plan.original_price)}
                          </span>
                        )}
                        {formatPrice(plan.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {billingCycleLabel(plan.billing_cycle)}
                      </span>
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
                <Label htmlFor="billing_cycle">Billing cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, billing_cycle: value })
                  }
                >
                  <SelectTrigger id="billing_cycle">
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Per month</SelectItem>
                    <SelectItem value="year">Per year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Interval for this plan&apos;s price
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0 or e.g. 9.99"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Main price (0 = free). Creates Stripe price when &gt; 0.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_price">Original price ($)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData({ ...formData, original_price: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Display only, shown with strikethrough when set
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
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
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setEditingPlan(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan details. Display name and description sync to Stripe product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_display_name">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_display_name"
                  placeholder="e.g., Pro, Elite"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plan ID (read-only)</Label>
                <Input
                  value={editingPlan?.name ?? ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
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
                <Label>Billing cycle (read-only)</Label>
                <Select value={formData.billing_cycle}>
                  <SelectTrigger className="bg-muted" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Per month</SelectItem>
                    <SelectItem value="year">Per year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Changing would require a new Stripe price
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price">
                  Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Display price (Stripe amount is set at creation)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_original_price">Original price ($)</Label>
                <Input
                  id="edit_original_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData({ ...formData, original_price: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Shown with strikethrough when set
                </p>
              </div>
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
                Credits added each billing cycle. Affects future renewals and new subscribers only.
              </p>
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
              <div className="space-y-2">
                <Label htmlFor="edit_sort_order">Sort Order</Label>
                <Input
                  id="edit_sort_order"
                  type="number"
                  min="0"
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between p-4 border rounded-lg flex-1">
                <div className="space-y-1">
                  <Label htmlFor="edit_is_popular" className="cursor-pointer font-medium">
                    Most Popular Badge
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only one plan can be &quot;Most popular&quot; at a time
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
              <div className="flex items-center justify-between p-4 border rounded-lg flex-1">
                <Label htmlFor="edit_is_active" className="cursor-pointer font-medium">
                  Active Plan
                </Label>
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
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

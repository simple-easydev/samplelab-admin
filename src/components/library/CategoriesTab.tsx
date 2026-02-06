import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Layers, 
  Search, 
  ArrowUpDown, 
  Edit, 
  Ban, 
  Trash2, 
  MoreHorizontal, 
  Loader2, 
  AlertCircle,
  Plus,
  Check,
  X,
  Hash
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/lib/supabase";

type SortOption = "a-z" | "z-a" | "most-used" | "popular" | "trending";
type StatusFilter = "all" | "active" | "inactive";

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  packs_count: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch categories from Supabase
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;

      // For each category, count packs
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Count packs using this category
          const { count: packsCount } = await supabase
            .from("packs")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id);

          return {
            ...category,
            packs_count: packsCount || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort categories
  const filteredAndSortedCategories = categories
    .filter((category) => {
      // Status filter
      if (statusFilter === "active" && !category.is_active) return false;
      if (statusFilter === "inactive" && category.is_active) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return category.name.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "z-a":
          return b.name.localeCompare(a.name);
        case "most-used":
        case "popular":
        case "trending":
          // All sort by pack count
          return b.packs_count - a.packs_count;
        default:
          return 0;
      }
    });

  // Handle Add Category
  const handleAddCategory = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setShowAddModal(true);
  };

  // Handle Edit Category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setShowEditModal(true);
  };

  // Handle Disable Category
  const handleDisableCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowDisableDialog(true);
  };

  // Handle Remove Category
  const handleRemoveCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowRemoveDialog(true);
  };

  // Save new category
  const saveNewCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);

      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from("categories").insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success("Category created successfully!", {
        description: `"${formData.name}" has been added to the categories list.`,
      });

      setShowAddModal(false);
      fetchCategories();
    } catch (err: any) {
      console.error("Error creating category:", err);
      toast.error("Failed to create category: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing category
  const updateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("categories")
        // @ts-expect-error - Supabase type inference issue
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        })
        .eq("id", editingCategory.id);

      if (error) throw error;

      toast.success("Category updated successfully!", {
        description: `Changes to "${formData.name}" have been saved.`,
      });

      setShowEditModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error updating category:", err);
      toast.error("Failed to update category: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm disable category
  const confirmDisableCategory = async () => {
    if (!selectedCategory) return;

    try {
      setIsUpdating(true);

      const newStatus = !selectedCategory.is_active;

      const { error } = await supabase
        .from("categories")
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: newStatus })
        .eq("id", selectedCategory.id);

      if (error) throw error;

      toast.success(
        newStatus
          ? `Category "${selectedCategory.name}" enabled`
          : `Category "${selectedCategory.name}" disabled`,
        {
          description: newStatus
            ? "This category is now available in filters."
            : "This category has been removed from filters but data is preserved.",
        }
      );

      setShowDisableDialog(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error updating category status:", err);
      toast.error("Failed to update category: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm remove category
  const confirmRemoveCategory = async () => {
    if (!selectedCategory) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", selectedCategory.id);

      if (error) throw error;

      toast.success(`Category "${selectedCategory.name}" removed`, {
        description: "The category has been permanently deleted.",
      });

      setShowRemoveDialog(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error removing category:", err);
      toast.error("Failed to remove category: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Categories
            </CardTitle>
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <Layers className="h-4 w-4 mr-2" />
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "active"
                    ? "Active"
                    : "Inactive"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("a-z")}>
                  A → Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("z-a")}>
                  Z → A
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("most-used")}>
                  Most Used
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>
                  Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("trending")}>
                  Trending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedCategories.length} of {categories.length} categories
          </div>

          {/* Categories Table */}
          {filteredAndSortedCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Click 'Add Category' to create your first category"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="text-center">Packs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{category.packs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? "default" : "secondary"}
                          className="font-normal"
                        >
                          {category.is_active ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisableCategory(category)}>
                              <Ban className="h-4 w-4 mr-2" />
                              {category.is_active ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveCategory(category)}
                              className="text-destructive"
                              disabled={category.packs_count > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                              {category.packs_count > 0 && (
                                <span className="ml-2 text-xs">(In Use)</span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new sound type category for organizing packs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder="e.g., Loops, One-Shots, Stems"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                placeholder="Internal notes or description for this category..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="category-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label htmlFor="category-active" className="font-normal cursor-pointer">
                Set as Active (available in filters)
              </Label>
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
            <Button onClick={saveNewCategory} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the name, description, or status of this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-category-name"
                placeholder="e.g., Loops, One-Shots, Stems"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-category-description"
                placeholder="Internal notes or description for this category..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-category-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label
                htmlFor="edit-category-active"
                className="font-normal cursor-pointer"
              >
                Set as Active (available in filters)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingCategory(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={updateCategory} disabled={isSaving}>
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

      {/* Disable/Enable Category Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCategory?.is_active ? "Disable" : "Enable"} Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCategory?.is_active ? (
                <>
                  This will remove <strong>"{selectedCategory.name}"</strong> from
                  category filters, but all existing data will be preserved. Packs
                  using this category will keep their assignments.
                </>
              ) : (
                <>
                  This will make <strong>"{selectedCategory?.name}"</strong>{" "}
                  available in category filters again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisableCategory}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedCategory?.is_active ? (
                "Disable Category"
              ) : (
                "Enable Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Category Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong>"{selectedCategory?.name}"</strong>?
                </p>
                {selectedCategory && selectedCategory.packs_count > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot remove: This category is in use.</strong>
                      <br />
                      {selectedCategory.packs_count} pack(s) are using this category.
                      Use "Disable" instead to hide it from filters.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. The category will be permanently
                      deleted from the database.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCategory}
              disabled={
                isUpdating ||
                (selectedCategory?.packs_count || 0) > 0
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

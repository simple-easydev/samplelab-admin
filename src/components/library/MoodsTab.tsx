import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Heart, 
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
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

type SortOption = "a-z" | "z-a" | "newest";
type StatusFilter = "all" | "active" | "inactive";

interface Mood {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function MoodsTab() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMood, setEditingMood] = useState<Mood | null>(null);
  const [moodName, setMoodName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch moods from Supabase
  useEffect(() => {
    fetchMoods();
  }, []);

  async function fetchMoods() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all moods
      const { data: moodsData, error: moodsError } = await supabase
        .from("moods")
        .select("*")
        .order("name", { ascending: true });

      if (moodsError) throw moodsError;

      setMoods(moodsData || []);
    } catch (err: any) {
      console.error("Error fetching moods:", err);
      setError("Failed to load moods: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort moods
  const filteredAndSortedMoods = moods
    .filter((mood) => {
      // Status filter
      if (statusFilter === "active" && !mood.is_active) return false;
      if (statusFilter === "inactive" && mood.is_active) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return mood.name.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "z-a":
          return b.name.localeCompare(a.name);
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  // Handle Add Mood
  const handleAddMood = () => {
    setMoodName("");
    setShowAddModal(true);
  };

  // Handle Edit Mood
  const handleEditMood = (mood: Mood) => {
    setEditingMood(mood);
    setMoodName(mood.name);
    setShowEditModal(true);
  };

  // Handle Disable Mood
  const handleDisableMood = (mood: Mood) => {
    setSelectedMood(mood);
    setShowDisableDialog(true);
  };

  // Handle Remove Mood
  const handleRemoveMood = (mood: Mood) => {
    setSelectedMood(mood);
    setShowRemoveDialog(true);
  };

  // Save new mood
  const saveNewMood = async () => {
    if (!moodName.trim()) {
      toast.error("Mood name is required");
      return;
    }

    try {
      setIsSaving(true);

      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from("moods").insert({
        name: moodName.trim(),
        is_active: true,
      });

      if (error) throw error;

      toast.success("Mood created successfully!", {
        description: `"${moodName}" has been added to the moods list.`,
      });

      setShowAddModal(false);
      fetchMoods();
    } catch (err: any) {
      console.error("Error creating mood:", err);
      toast.error("Failed to create mood: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing mood
  const updateMood = async () => {
    if (!editingMood || !moodName.trim()) {
      toast.error("Mood name is required");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("moods")
        // @ts-expect-error - Supabase type inference issue
        .update({
          name: moodName.trim(),
        })
        .eq("id", editingMood.id);

      if (error) throw error;

      toast.success("Mood updated successfully!", {
        description: `Changes to "${moodName}" have been saved.`,
      });

      setShowEditModal(false);
      setEditingMood(null);
      fetchMoods();
    } catch (err: any) {
      console.error("Error updating mood:", err);
      toast.error("Failed to update mood: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm disable mood
  const confirmDisableMood = async () => {
    if (!selectedMood) return;

    try {
      setIsUpdating(true);

      const newStatus = !selectedMood.is_active;

      const { error } = await supabase
        .from("moods")
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: newStatus })
        .eq("id", selectedMood.id);

      if (error) throw error;

      toast.success(
        newStatus
          ? `Mood "${selectedMood.name}" enabled`
          : `Mood "${selectedMood.name}" disabled`,
        {
          description: newStatus
            ? "This mood is now available for tagging."
            : "This mood has been removed from filters but data is preserved.",
        }
      );

      setShowDisableDialog(false);
      setSelectedMood(null);
      fetchMoods();
    } catch (err: any) {
      console.error("Error updating mood status:", err);
      toast.error("Failed to update mood: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm remove mood
  const confirmRemoveMood = async () => {
    if (!selectedMood) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("moods")
        .delete()
        .eq("id", selectedMood.id);

      if (error) throw error;

      toast.success(`Mood "${selectedMood.name}" removed`, {
        description: "The mood has been permanently deleted.",
      });

      setShowRemoveDialog(false);
      setSelectedMood(null);
      fetchMoods();
    } catch (err: any) {
      console.error("Error removing mood:", err);
      toast.error("Failed to remove mood: " + err.message);
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
            <p className="text-muted-foreground">Loading moods...</p>
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
              <Heart className="h-5 w-5 text-pink-500" />
              Moods
            </CardTitle>
            <Button onClick={handleAddMood}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mood
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Lightweight tags for emotional/vibe categorization
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search moods..."
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
                  <Heart className="h-4 w-4 mr-2" />
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
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedMoods.length} of {moods.length} moods
          </div>

          {/* Moods Table */}
          {filteredAndSortedMoods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No moods found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Click 'Add Mood' to create your first mood tag"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mood Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMoods.map((mood) => (
                    <TableRow key={mood.id}>
                      <TableCell>
                        <p className="font-medium">{mood.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={mood.is_active ? "default" : "secondary"}
                          className="font-normal"
                        >
                          {mood.is_active ? (
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
                            <DropdownMenuItem onClick={() => handleEditMood(mood)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Mood
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisableMood(mood)}>
                              <Ban className="h-4 w-4 mr-2" />
                              {mood.is_active ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMood(mood)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
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

      {/* Add Mood Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Mood</DialogTitle>
            <DialogDescription>
              Create a new mood tag for emotional/vibe categorization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mood-name">
                Mood Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mood-name"
                placeholder="e.g., Chill, Dark, Uplifting"
                value={moodName}
                onChange={(e) => setMoodName(e.target.value)}
                disabled={isSaving}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Keep it simple and descriptive (e.g., Happy, Sad, Aggressive)
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
            <Button onClick={saveNewMood} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Mood"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mood Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Mood</DialogTitle>
            <DialogDescription>
              Update the name of this mood tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-mood-name">
                Mood Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-mood-name"
                placeholder="e.g., Chill, Dark, Uplifting"
                value={moodName}
                onChange={(e) => setMoodName(e.target.value)}
                disabled={isSaving}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingMood(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={updateMood} disabled={isSaving}>
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

      {/* Disable/Enable Mood Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMood?.is_active ? "Disable" : "Enable"} Mood?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMood?.is_active ? (
                <>
                  This will remove <strong>"{selectedMood.name}"</strong> from
                  mood filters, but all existing data will be preserved.
                </>
              ) : (
                <>
                  This will make <strong>"{selectedMood?.name}"</strong>{" "}
                  available in mood filters again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisableMood}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedMood?.is_active ? (
                "Disable Mood"
              ) : (
                "Enable Mood"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Mood Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Mood?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong>"{selectedMood?.name}"</strong>?
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This action cannot be undone. The mood will be permanently
                    deleted from the database. If it's currently in use, consider
                    using "Disable" instead.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMood}
              disabled={isUpdating}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Mood"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Tag, 
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

interface Genre {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  packs_count: number;
  samples_count: number;
}

interface GenreFormData {
  name: string;
  description: string;
  is_active: boolean;
}

export function GenresTab() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState<GenreFormData>({
    name: "",
    description: "",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch genres from Supabase
  useEffect(() => {
    fetchGenres();
  }, []);

  async function fetchGenres() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all genres
      const { data: genresData, error: genresError } = await supabase
        .from("genres")
        .select("*")
        .order("name", { ascending: true });

      if (genresError) throw genresError;

      // For each genre, count packs and samples
      const genresWithCounts = await Promise.all(
        (genresData || []).map(async (genre) => {
          // Count packs using this genre
          const { count: packsCount } = await supabase
            .from("pack_genres")
            .select("*", { count: "exact", head: true })
            .eq("genre_id", genre.id);

          // Count samples in packs that use this genre
          const { data: packIds } = await supabase
            .from("pack_genres")
            .select("pack_id")
            .eq("genre_id", genre.id);

          let samplesCount = 0;
          if (packIds && packIds.length > 0) {
            const { count } = await supabase
              .from("samples")
              .select("*", { count: "exact", head: true })
              .in("pack_id", packIds.map((p) => p.pack_id))
              .in("status", ["Active", "Disabled"]); // Exclude deleted samples

            samplesCount = count || 0;
          }

          return {
            ...genre,
            packs_count: packsCount || 0,
            samples_count: samplesCount,
          };
        })
      );

      setGenres(genresWithCounts);
    } catch (err: any) {
      console.error("Error fetching genres:", err);
      setError("Failed to load genres: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort genres
  const filteredAndSortedGenres = genres
    .filter((genre) => {
      // Status filter
      if (statusFilter === "active" && !genre.is_active) return false;
      if (statusFilter === "inactive" && genre.is_active) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return genre.name.toLowerCase().includes(query);
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
          return b.packs_count - a.packs_count;
        case "popular":
          return b.samples_count - a.samples_count;
        case "trending":
          // For now, same as most-used (could be enhanced with time-based logic)
          return b.packs_count - a.packs_count;
        default:
          return 0;
      }
    });

  // Handle Add Genre
  const handleAddGenre = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setShowAddModal(true);
  };

  // Handle Edit Genre
  const handleEditGenre = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || "",
      is_active: genre.is_active,
    });
    setShowEditModal(true);
  };

  // Handle Disable Genre
  const handleDisableGenre = (genre: Genre) => {
    setSelectedGenre(genre);
    setShowDisableDialog(true);
  };

  // Handle Remove Genre
  const handleRemoveGenre = (genre: Genre) => {
    setSelectedGenre(genre);
    setShowRemoveDialog(true);
  };

  // Save new genre
  const saveNewGenre = async () => {
    if (!formData.name.trim()) {
      toast.error("Genre name is required");
      return;
    }

    try {
      setIsSaving(true);

      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from("genres").insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success("Genre created successfully!", {
        description: `"${formData.name}" has been added to the genre list.`,
      });

      setShowAddModal(false);
      fetchGenres();
    } catch (err: any) {
      console.error("Error creating genre:", err);
      toast.error("Failed to create genre: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing genre
  const updateGenre = async () => {
    if (!editingGenre || !formData.name.trim()) {
      toast.error("Genre name is required");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("genres")
        // @ts-expect-error - Supabase type inference issue
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        })
        .eq("id", editingGenre.id);

      if (error) throw error;

      toast.success("Genre updated successfully!", {
        description: `Changes to "${formData.name}" have been saved.`,
      });

      setShowEditModal(false);
      setEditingGenre(null);
      fetchGenres();
    } catch (err: any) {
      console.error("Error updating genre:", err);
      toast.error("Failed to update genre: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm disable genre
  const confirmDisableGenre = async () => {
    if (!selectedGenre) return;

    try {
      setIsUpdating(true);

      const newStatus = !selectedGenre.is_active;

      // @ts-expect-error - Supabase type inference issue with update
      const { error } = await supabase
        .from("genres")
        .update({ is_active: newStatus })
        .eq("id", selectedGenre.id);

      if (error) throw error;

      toast.success(
        newStatus
          ? `Genre "${selectedGenre.name}" enabled`
          : `Genre "${selectedGenre.name}" disabled`,
        {
          description: newStatus
            ? "This genre is now available in filters."
            : "This genre has been removed from filters but data is preserved.",
        }
      );

      setShowDisableDialog(false);
      setSelectedGenre(null);
      fetchGenres();
    } catch (err: any) {
      console.error("Error updating genre status:", err);
      toast.error("Failed to update genre: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm remove genre
  const confirmRemoveGenre = async () => {
    if (!selectedGenre) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("genres")
        .delete()
        .eq("id", selectedGenre.id);

      if (error) throw error;

      toast.success(`Genre "${selectedGenre.name}" removed`, {
        description: "The genre has been permanently deleted.",
      });

      setShowRemoveDialog(false);
      setSelectedGenre(null);
      fetchGenres();
    } catch (err: any) {
      console.error("Error removing genre:", err);
      toast.error("Failed to remove genre: " + err.message);
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
            <p className="text-muted-foreground">Loading genres...</p>
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
              <Tag className="h-5 w-5 text-green-500" />
              Genres
            </CardTitle>
            <Button onClick={handleAddGenre}>
              <Plus className="h-4 w-4 mr-2" />
              Add Genre
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
                  placeholder="Search genres..."
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
                  <Tag className="h-4 w-4 mr-2" />
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
            Showing {filteredAndSortedGenres.length} of {genres.length} genres
          </div>

          {/* Genres Table */}
          {filteredAndSortedGenres.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No genres found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Click 'Add Genre' to create your first genre"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Genre Name</TableHead>
                    <TableHead className="text-center">Packs</TableHead>
                    <TableHead className="text-center">Samples</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedGenres.map((genre) => (
                    <TableRow key={genre.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{genre.name}</p>
                          {genre.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {genre.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{genre.packs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{genre.samples_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={genre.is_active ? "default" : "secondary"}
                          className="font-normal"
                        >
                          {genre.is_active ? (
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
                            <DropdownMenuItem onClick={() => handleEditGenre(genre)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Genre
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisableGenre(genre)}>
                              <Ban className="h-4 w-4 mr-2" />
                              {genre.is_active ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveGenre(genre)}
                              className="text-destructive"
                              disabled={
                                genre.packs_count > 0 || genre.samples_count > 0
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                              {(genre.packs_count > 0 || genre.samples_count > 0) && (
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

      {/* Add Genre Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Genre</DialogTitle>
            <DialogDescription>
              Create a new musical style/genre for categorizing packs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="genre-name">
                Genre Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="genre-name"
                placeholder="e.g., Hip-Hop, R&B, Trap"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre-description">Description (Optional)</Label>
              <Textarea
                id="genre-description"
                placeholder="Internal notes or description for this genre..."
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
                id="genre-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label htmlFor="genre-active" className="font-normal cursor-pointer">
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
            <Button onClick={saveNewGenre} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Genre"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Genre Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Genre</DialogTitle>
            <DialogDescription>
              Update the name, description, or status of this genre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-genre-name">
                Genre Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-genre-name"
                placeholder="e.g., Hip-Hop, R&B, Trap"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-genre-description">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-genre-description"
                placeholder="Internal notes or description for this genre..."
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
                id="edit-genre-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label
                htmlFor="edit-genre-active"
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
                setEditingGenre(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={updateGenre} disabled={isSaving}>
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

      {/* Disable/Enable Genre Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedGenre?.is_active ? "Disable" : "Enable"} Genre?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGenre?.is_active ? (
                <>
                  This will remove <strong>"{selectedGenre.name}"</strong> from
                  genre filters, but all existing data will be preserved. Packs
                  and samples using this genre will keep their assignments.
                </>
              ) : (
                <>
                  This will make <strong>"{selectedGenre?.name}"</strong>{" "}
                  available in genre filters again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisableGenre}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedGenre?.is_active ? (
                "Disable Genre"
              ) : (
                "Enable Genre"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Genre Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Genre?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong>"{selectedGenre?.name}"</strong>?
                </p>
                {selectedGenre && (selectedGenre.packs_count > 0 || selectedGenre.samples_count > 0) ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot remove: This genre is in use.</strong>
                      <br />
                      {selectedGenre.packs_count} pack(s) and{" "}
                      {selectedGenre.samples_count} sample(s) are using this genre.
                      Use "Disable" instead to hide it from filters.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. The genre will be permanently
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
              onClick={confirmRemoveGenre}
              disabled={
                isUpdating ||
                (selectedGenre?.packs_count || 0) > 0 ||
                (selectedGenre?.samples_count || 0) > 0
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Genre"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

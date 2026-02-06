import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  UserCircle, 
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
  Hash,
  Eye,
  Download,
  Mail,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type SortOption = "a-z" | "newest" | "most-downloads";
type StatusFilter = "all" | "active" | "disabled";

interface Creator {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  packs_count: number;
  samples_count: number;
  downloads_30d: number;
}

interface CreatorFormData {
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  is_active: boolean;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [viewingCreator, setViewingCreator] = useState<Creator | null>(null);
  const [formData, setFormData] = useState<CreatorFormData>({
    name: "",
    email: "",
    bio: "",
    avatar_url: "",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch creators from Supabase
  useEffect(() => {
    fetchCreators();
  }, []);

  async function fetchCreators() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all creators
      const { data: creatorsData, error: creatorsError } = await supabase
        .from("creators")
        .select("*")
        .order("name", { ascending: true });

      if (creatorsError) throw creatorsError;

      // For each creator, count packs, samples, and recent downloads
      const creatorsWithCounts = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          // Count packs by this creator
          const { count: packsCount } = await supabase
            .from("packs")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", creator.id);

          // Count samples in packs by this creator
          const { data: packIds } = await supabase
            .from("packs")
            .select("id")
            .eq("creator_id", creator.id);

          let samplesCount = 0;
          if (packIds && packIds.length > 0) {
            const { count } = await supabase
              .from("samples")
              .select("*", { count: "exact", head: true })
              .in("pack_id", packIds.map((p) => p.id))
              .in("status", ["Active", "Disabled"]); // Exclude deleted

            samplesCount = count || 0;
          }

          // Calculate downloads in last 30 days
          // For now, using total downloads from packs (can be enhanced with time-based logic)
          const { data: packsData } = await supabase
            .from("packs")
            .select("download_count")
            .eq("creator_id", creator.id);

          const downloads30d = (packsData || []).reduce(
            (sum, pack) => sum + (pack.download_count || 0),
            0
          );

          return {
            ...creator,
            packs_count: packsCount || 0,
            samples_count: samplesCount,
            downloads_30d: downloads30d,
          };
        })
      );

      setCreators(creatorsWithCounts);
    } catch (err: any) {
      console.error("Error fetching creators:", err);
      setError("Failed to load creators: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort creators
  const filteredAndSortedCreators = creators
    .filter((creator) => {
      // Status filter
      if (statusFilter === "active" && !creator.is_active) return false;
      if (statusFilter === "disabled" && creator.is_active) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = creator.name.toLowerCase().includes(query);
        const emailMatch = creator.email?.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "most-downloads":
          return b.downloads_30d - a.downloads_30d;
        default:
          return 0;
      }
    });

  // Handle Add Creator
  const handleAddCreator = () => {
    setFormData({
      name: "",
      email: "",
      bio: "",
      avatar_url: "",
      is_active: true,
    });
    setShowAddModal(true);
  };

  // Handle View Creator
  const handleViewCreator = (creator: Creator) => {
    setViewingCreator(creator);
    setShowViewModal(true);
  };

  // Handle Edit Creator
  const handleEditCreator = (creator: Creator) => {
    setEditingCreator(creator);
    setFormData({
      name: creator.name,
      email: creator.email || "",
      bio: creator.bio || "",
      avatar_url: creator.avatar_url || "",
      is_active: creator.is_active,
    });
    setShowEditModal(true);
  };

  // Handle Disable Creator
  const handleDisableCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowDisableDialog(true);
  };

  // Handle Delete Creator
  const handleDeleteCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    setDeleteConfirmText("");
    setShowDeleteDialog(true);
  };

  // Save new creator
  const saveNewCreator = async () => {
    if (!formData.name.trim()) {
      toast.error("Creator name is required");
      return;
    }

    try {
      setIsSaving(true);

      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from("creators").insert({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        bio: formData.bio.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success("Creator added successfully!", {
        description: `"${formData.name}" has been added to your creators list.`,
      });

      setShowAddModal(false);
      fetchCreators();
    } catch (err: any) {
      console.error("Error creating creator:", err);
      toast.error("Failed to create creator: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing creator
  const updateCreator = async () => {
    if (!editingCreator || !formData.name.trim()) {
      toast.error("Creator name is required");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("creators")
        // @ts-expect-error - Supabase type inference issue
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatar_url.trim() || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCreator.id);

      if (error) throw error;

      toast.success("Creator updated successfully!", {
        description: `Changes to "${formData.name}" have been saved.`,
      });

      setShowEditModal(false);
      setEditingCreator(null);
      fetchCreators();
    } catch (err: any) {
      console.error("Error updating creator:", err);
      toast.error("Failed to update creator: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm disable/enable creator
  const confirmDisableCreator = async () => {
    if (!selectedCreator) return;

    try {
      setIsUpdating(true);

      const newStatus = !selectedCreator.is_active;

      const { error } = await supabase
        .from("creators")
        // @ts-expect-error - Supabase type inference issue with update
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCreator.id);

      if (error) throw error;

      toast.success(
        newStatus
          ? `Creator "${selectedCreator.name}" enabled`
          : `Creator "${selectedCreator.name}" disabled`,
        {
          description: newStatus
            ? "This creator is now active and can be assigned to packs."
            : "This creator is disabled but all existing packs are preserved.",
        }
      );

      setShowDisableDialog(false);
      setSelectedCreator(null);
      fetchCreators();
    } catch (err: any) {
      console.error("Error updating creator status:", err);
      toast.error("Failed to update creator: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm delete creator
  const confirmDeleteCreator = async () => {
    if (!selectedCreator) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("creators")
        .delete()
        .eq("id", selectedCreator.id);

      if (error) throw error;

      toast.success(`Creator "${selectedCreator.name}" deleted`, {
        description: "The creator has been permanently removed.",
      });

      setShowDeleteDialog(false);
      setSelectedCreator(null);
      setDeleteConfirmText("");
      fetchCreators();
    } catch (err: any) {
      console.error("Error deleting creator:", err);
      toast.error("Failed to delete creator: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmText("");
    setSelectedCreator(null);
  };

  // Get creator initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creators</h1>
          <p className="text-muted-foreground mt-1">Manage sample pack creators</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creators</h1>
          <p className="text-muted-foreground mt-1">Manage sample pack creators</p>
        </div>
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Creators</h1>
            <p className="text-muted-foreground mt-1">Manage sample pack creators</p>
          </div>
          <Button onClick={handleAddCreator}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Creator
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-500" />
              Creators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
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
                    <User className="h-4 w-4 mr-2" />
                    {statusFilter === "all"
                      ? "All Status"
                      : statusFilter === "active"
                      ? "Active"
                      : "Disabled"}
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
                  <DropdownMenuItem onClick={() => setStatusFilter("disabled")}>
                    Disabled
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
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    Newest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("most-downloads")}>
                    Most Downloads
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedCreators.length} of {creators.length} creators
            </div>

            {/* Creators Table */}
            {filteredAndSortedCreators.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No creators found</p>
                <p className="text-sm mt-2">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Click 'Add New Creator' to create your first creator"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Creator Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Packs</TableHead>
                      <TableHead className="text-center">Samples</TableHead>
                      <TableHead className="text-center">Downloads (30d)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCreators.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(creator.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{creator.name}</p>
                          {creator.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {creator.bio}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {creator.email ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {creator.email}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{creator.packs_count}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{creator.samples_count}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{creator.downloads_30d}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={creator.is_active ? "default" : "secondary"}
                            className="font-normal"
                          >
                            {creator.is_active ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Disabled
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
                              <DropdownMenuItem onClick={() => handleViewCreator(creator)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Creator
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCreator(creator)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Creator
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDisableCreator(creator)}>
                                <Ban className="h-4 w-4 mr-2" />
                                {creator.is_active ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteCreator(creator)}
                                className="text-destructive"
                                disabled={creator.packs_count > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                                {creator.packs_count > 0 && (
                                  <span className="ml-2 text-xs">(Has Packs)</span>
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
      </div>

      {/* Add Creator Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Creator</DialogTitle>
            <DialogDescription>
              Create a new creator profile for sample packs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="creator-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="creator-name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-email">Email (Optional)</Label>
              <Input
                id="creator-email"
                type="email"
                placeholder="e.g., john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-bio">Bio (Optional)</Label>
              <Textarea
                id="creator-bio"
                placeholder="Short description or bio..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-avatar">Avatar URL (Optional)</Label>
              <Input
                id="creator-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="creator-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label htmlFor="creator-active" className="font-normal cursor-pointer">
                Set as Active (can be assigned to packs)
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
            <Button onClick={saveNewCreator} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Creator"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Creator Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Creator Details</DialogTitle>
            <DialogDescription>
              View information about this creator.
            </DialogDescription>
          </DialogHeader>
          {viewingCreator && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewingCreator.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(viewingCreator.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewingCreator.name}</h3>
                  {viewingCreator.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {viewingCreator.email}
                    </p>
                  )}
                </div>
              </div>

              {viewingCreator.bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <p className="text-sm mt-1">{viewingCreator.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{viewingCreator.packs_count}</p>
                  <p className="text-xs text-muted-foreground">Packs</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{viewingCreator.samples_count}</p>
                  <p className="text-xs text-muted-foreground">Samples</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{viewingCreator.downloads_30d}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={viewingCreator.is_active ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {viewingCreator.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm mt-1">
                    {new Date(viewingCreator.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Creator Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Creator</DialogTitle>
            <DialogDescription>
              Update the creator's information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-creator-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-creator-name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-creator-email">Email (Optional)</Label>
              <Input
                id="edit-creator-email"
                type="email"
                placeholder="e.g., john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-creator-bio">Bio (Optional)</Label>
              <Textarea
                id="edit-creator-bio"
                placeholder="Short description or bio..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-creator-avatar">Avatar URL (Optional)</Label>
              <Input
                id="edit-creator-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-creator-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label
                htmlFor="edit-creator-active"
                className="font-normal cursor-pointer"
              >
                Set as Active (can be assigned to packs)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingCreator(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={updateCreator} disabled={isSaving}>
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

      {/* Disable/Enable Creator Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCreator?.is_active ? "Disable" : "Enable"} Creator?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCreator?.is_active ? (
                <>
                  This will disable <strong>"{selectedCreator.name}"</strong>, making
                  them unavailable for new pack assignments. All existing packs and data
                  will be preserved.
                </>
              ) : (
                <>
                  This will enable <strong>"{selectedCreator?.name}"</strong>, making
                  them available for pack assignments again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisableCreator}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedCreator?.is_active ? (
                "Disable Creator"
              ) : (
                "Enable Creator"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Creator Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Creator?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="font-medium text-destructive">
                  This action is permanent and cannot be undone.
                </p>

                {selectedCreator && selectedCreator.packs_count > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot delete: This creator has {selectedCreator.packs_count} pack(s).</strong>
                      <br />
                      Creators with existing packs cannot be deleted. Use "Disable" instead.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <p>
                        Are you sure you want to permanently delete{" "}
                        <strong>"{selectedCreator?.name}"</strong>?
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm" className="text-sm font-medium">
                        To confirm, type <code className="bg-muted px-1 py-0.5 rounded text-destructive">delete</code> below:
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type 'delete' to confirm"
                        disabled={isUpdating}
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCreator}
              disabled={
                isUpdating ||
                (selectedCreator?.packs_count || 0) > 0 ||
                deleteConfirmText.toLowerCase() !== "delete"
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Creator"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

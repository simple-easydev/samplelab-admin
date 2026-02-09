import { useState } from "react";
import { LayoutTemplate, Plus, MoreVertical, Edit, Power, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import CreateBannerModal from "./CreateBannerModal";
import EditBannerModal from "./EditBannerModal";
import { supabase } from "@/lib/supabase";
import useSWR from "swr";
import { toast } from "sonner";
import type { Banner } from "@/types";

export function BannerTab() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Fetch banners from database
  const { data: banners = [], error, isLoading, mutate } = useSWR<Banner[]>(
    "banners",
    async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    }
  );

  if (error) {
    console.error("Error fetching banners:", error);
  }

  const hasActiveBanner = banners.some(b => b.active);

  const handleCreateBanner = async (newBannerData: {
    headline: string;
    message: string;
    ctaLabel: string;
    ctaUrl: string;
    audience: string;
    active: boolean;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("banners")
        // @ts-expect-error - Supabase generated types may be out of sync
        .insert({
          headline: newBannerData.headline,
          message: newBannerData.message,
          cta_label: newBannerData.ctaLabel || null,
          cta_url: newBannerData.ctaUrl || null,
          audience: newBannerData.audience,
          active: newBannerData.active,
          created_by: session.user.id,
        });

      if (error) throw error;

      // Refresh the list
      mutate();
    } catch (error: any) {
      console.error("Error creating banner:", error);
      throw error;
    }
  };

  const handleToggleBanner = (banner: Banner) => {
    // If trying to activate a banner while another is active, prevent it
    if (!banner.active && hasActiveBanner) {
      toast.error("Only one banner can be active at a time. Please deactivate the current banner first.");
      return;
    }

    setSelectedBanner(banner);
    setToggleDialogOpen(true);
  };

  const confirmToggle = async () => {
    if (!selectedBanner) return;

    try {
      const { error } = await supabase
        .from("banners")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({ active: !selectedBanner.active })
        .eq("id", selectedBanner.id);

      if (error) throw error;

      toast.success(`Banner ${!selectedBanner.active ? 'activated' : 'deactivated'}`);
      mutate();
    } catch (error: any) {
      console.error("Error toggling banner:", error);
      toast.error(error?.message || "Failed to toggle banner");
    } finally {
      setToggleDialogOpen(false);
      setSelectedBanner(null);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setEditModalOpen(true);
  };

  const handleUpdateBanner = async (
    bannerId: string,
    updates: {
      headline: string;
      message: string;
      ctaLabel: string;
      ctaUrl: string;
      audience: string;
      active: boolean;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("banners")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({
          headline: updates.headline,
          message: updates.message,
          cta_label: updates.ctaLabel || null,
          cta_url: updates.ctaUrl || null,
          audience: updates.audience,
          active: updates.active,
        })
        .eq("id", bannerId);

      if (error) throw error;

      // Refresh the list
      mutate();
    } catch (error: any) {
      console.error("Error updating banner:", error);
      throw error;
    }
  };

  const handleDeleteBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBanner) return;

    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", selectedBanner.id);

      if (error) throw error;

      toast.success("Banner deleted successfully");
      mutate();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      toast.error(error?.message || "Failed to delete banner");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBanner(null);
    }
  };

  const getAudienceLabel = (audience: string) => {
    return audience === "all" ? "All Visitors" : "Logged-in Only";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive">Failed to load banners</p>
            <Button onClick={() => mutate()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Loading banners...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Banner Announcements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage banners that appear at the top of pages
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Banner
        </Button>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No banners yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first banner to get started
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">
                      {banner.headline}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={banner.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {banner.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getAudienceLabel(banner.audience)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditBanner(banner)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Banner
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleBanner(banner)}
                        disabled={!banner.active && hasActiveBanner}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {banner.active ? "Turn Off" : "Turn On"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteBanner(banner)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <CardDescription className="line-clamp-3 text-sm">
                  {banner.message}
                </CardDescription>
                
                {(banner.cta_label || banner.cta_url) && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Call to Action</p>
                    {banner.cta_label && (
                      <p className="text-sm font-medium">{banner.cta_label}</p>
                    )}
                    {banner.cta_url && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {banner.cta_url}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-muted-foreground">
                  Created {new Date(banner.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toggle Confirmation Dialog */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedBanner?.active ? "Deactivate" : "Activate"} Banner
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBanner?.active ? (
                <>
                  Are you sure you want to deactivate "{selectedBanner?.headline}"? 
                  Users will no longer see this banner.
                </>
              ) : (
                <>
                  Are you sure you want to activate "{selectedBanner?.headline}"? 
                  This banner will be displayed to users immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {selectedBanner?.active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBanner?.headline}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Banner Modal */}
      <CreateBannerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateBanner}
        hasActiveBanner={hasActiveBanner}
      />

      {/* Edit Banner Modal */}
      <EditBannerModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBanner(null);
        }}
        onSuccess={handleUpdateBanner}
        banner={selectedBanner}
        hasOtherActiveBanner={
          selectedBanner
            ? banners.some((b) => b.active && b.id !== selectedBanner.id)
            : false
        }
      />
    </div>
  );
}

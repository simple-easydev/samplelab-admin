import { useState } from "react";
import { MessageSquare, Plus, MoreVertical, Edit, Power, Trash2, Loader2 } from "lucide-react";
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
import CreatePopupModal from "./CreatePopupModal";
import EditPopupModal from "./EditPopupModal";
import { supabase } from "@/lib/supabase";
import useSWR from "swr";
import { toast } from "sonner";
import type { Popup } from "@/types";

export function PopupsTab() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<Popup | null>(null);

  // Fetch popups from database
  const { data: popups = [], error, isLoading, mutate } = useSWR<Popup[]>(
    "popups",
    async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    }
  );

  if (error) {
    console.error("Error fetching popups:", error);
  }

  const hasActivePopup = popups.some(p => p.active);

  const handleCreatePopup = async (newPopupData: {
    title: string;
    message: string;
    ctaLabel: string;
    ctaUrl: string;
    audience: string;
    frequency: string;
    active: boolean;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("popups")
        // @ts-expect-error - Supabase generated types may be out of sync
        .insert({
          title: newPopupData.title,
          message: newPopupData.message,
          cta_label: newPopupData.ctaLabel || null,
          cta_url: newPopupData.ctaUrl || null,
          audience: newPopupData.audience,
          frequency: newPopupData.frequency,
          active: newPopupData.active,
          created_by: session.user.id,
        });

      if (error) throw error;

      // Refresh the list
      mutate();
    } catch (error: any) {
      console.error("Error creating popup:", error);
      throw error;
    }
  };

  const handleTogglePopup = (popup: Popup) => {
    // If trying to activate a popup while another is active, prevent it
    if (!popup.active && hasActivePopup) {
      toast.error("Only one pop-up can be active at a time. Please deactivate the current pop-up first.");
      return;
    }

    setSelectedPopup(popup);
    setToggleDialogOpen(true);
  };

  const confirmToggle = async () => {
    if (!selectedPopup) return;

    try {
      const { error } = await supabase
        .from("popups")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({ active: !selectedPopup.active })
        .eq("id", selectedPopup.id);

      if (error) throw error;

      toast.success(`Pop-up ${!selectedPopup.active ? 'activated' : 'deactivated'}`);
      mutate();
    } catch (error: any) {
      console.error("Error toggling popup:", error);
      toast.error(error?.message || "Failed to toggle pop-up");
    } finally {
      setToggleDialogOpen(false);
      setSelectedPopup(null);
    }
  };

  const handleEditPopup = (popup: Popup) => {
    setSelectedPopup(popup);
    setEditModalOpen(true);
  };

  const handleUpdatePopup = async (
    popupId: string,
    updates: {
      title: string;
      message: string;
      ctaLabel: string;
      ctaUrl: string;
      audience: string;
      frequency: string;
      active: boolean;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("popups")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({
          title: updates.title,
          message: updates.message,
          cta_label: updates.ctaLabel || null,
          cta_url: updates.ctaUrl || null,
          audience: updates.audience,
          frequency: updates.frequency,
          active: updates.active,
        })
        .eq("id", popupId);

      if (error) throw error;

      // Refresh the list
      mutate();
    } catch (error: any) {
      console.error("Error updating popup:", error);
      throw error;
    }
  };

  const handleDeletePopup = (popup: Popup) => {
    setSelectedPopup(popup);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPopup) return;

    try {
      const { error } = await supabase
        .from("popups")
        .delete()
        .eq("id", selectedPopup.id);

      if (error) throw error;

      toast.success("Pop-up deleted successfully");
      mutate();
    } catch (error: any) {
      console.error("Error deleting popup:", error);
      toast.error(error?.message || "Failed to delete pop-up");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPopup(null);
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all":
        return "All Users";
      case "subscribers":
        return "Subscribers Only";
      case "trial":
        return "Trial Users";
      default:
        return audience;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency === "once" ? "Show Once" : "Until Dismissed";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pop-up Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">Failed to load pop-ups</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pop-up Announcements
              </CardTitle>
              <CardDescription className="mt-1.5">
                Manage pop-up announcements that appear as modals to users.
                Only one pop-up can be active at a time.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pop-up
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Pop-ups List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : popups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No pop-ups created yet</p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Pop-up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popups.map((popup) => (
            <Card key={popup.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {popup.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={popup.active ? "default" : "secondary"}>
                        {popup.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getAudienceLabel(popup.audience)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getFrequencyLabel(popup.frequency)}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPopup(popup)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePopup(popup)}>
                        <Power className="h-4 w-4 mr-2" />
                        Turn {popup.active ? "Off" : "On"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeletePopup(popup)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {popup.message}
                </p>
                {popup.cta_label && (
                  <p className="text-xs text-muted-foreground mt-3">
                    CTA: {popup.cta_label}
                  </p>
                )}
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
              {selectedPopup?.active ? "Deactivate" : "Activate"} Pop-up?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPopup?.active
                ? "This pop-up will no longer be shown to users."
                : "This pop-up will start appearing to users. Any other active pop-up will need to be deactivated first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {selectedPopup?.active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pop-up?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pop-up
              announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Pop-up Modal */}
      <CreatePopupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreatePopup}
        hasActivePopup={hasActivePopup}
      />

      {/* Edit Pop-up Modal */}
      <EditPopupModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPopup(null);
        }}
        onSuccess={handleUpdatePopup}
        popup={selectedPopup}
        hasOtherActivePopup={
          selectedPopup
            ? popups.some((p) => p.active && p.id !== selectedPopup.id)
            : false
        }
      />
    </div>
  );
}

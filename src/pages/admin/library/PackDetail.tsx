import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Ban,
  Check,
  Trash2,
  Play,
  Pause,
  Volume2,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Download,
  Music,
  Tag,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/lib/supabase";
import {
  CREDIT_COSTS,
  STEMS_BUNDLE_COST,
  getDefaultCreditCost,
  getPremiumCreditCost,
} from "@/config/credits";

interface PackDetail {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  creator_name: string;
  cover_url: string | null;
  category_id: string;
  category_name: string;
  genres: string[]; // Array of genre names
  tags: string[];
  is_premium: boolean;
  status: "Draft" | "Published" | "Disabled";
  download_count: number;
  created_at: string;
  updated_at: string;
  samples_count: number;
  sample_types: string[]; // Types found in this pack (Loop, One-shot)
  has_stems: boolean; // Does any sample have stems?
  preview_sample_url: string | null; // First sample audio URL for preview
}

export default function PackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pack, setPack] = useState<PackDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch pack details
  useEffect(() => {
    if (!id) return;

    async function fetchPackDetail() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch pack with related data
        const { data: packData, error: packError } = await supabase
          .from("packs")
          .select(
            `
            id,
            name,
            description,
            creator_id,
            cover_url,
            category_id,
            tags,
            is_premium,
            status,
            download_count,
            created_at,
            updated_at,
            creators (name),
            categories (name)
          `
          )
          .eq("id", id)
          .single();

        if (packError) throw packError;
        if (!packData) throw new Error("Pack not found");

        // Fetch pack genres
        const { data: packGenres, error: genresError } = await supabase
          .from("pack_genres")
          .select(
            `
            genre_id,
            genres (name)
          `
          )
          .eq("pack_id", id);

        if (genresError) throw genresError;

        // Fetch samples for this pack (exclude soft-deleted samples)
        const { data: samplesData, error: samplesError } = await supabase
          .from("samples")
          .select("id, type, has_stems, audio_url")
          .eq("pack_id", id)
          .in("status", ["Active", "Disabled"]); // Exclude Deleted samples

        if (samplesError) throw samplesError;

        // Extract genres
        const genres = packGenres
          ?.map((pg: any) => pg.genres?.name)
          .filter(Boolean) || [];

        // Extract sample types and check if any have stems
        const sampleTypes = Array.from(
          new Set(samplesData?.map((s: any) => s.type) || [])
        );
        const hasStems = samplesData?.some((s: any) => s.has_stems) || false;

        // Get first sample audio URL for preview
        const previewSampleUrl = samplesData?.[0]?.audio_url || null;

        const packDetail: PackDetail = {
          id: packData.id,
          name: packData.name,
          description: packData.description,
          creator_id: packData.creator_id,
          creator_name: (packData.creators as any)?.name || "Unknown",
          cover_url: packData.cover_url,
          category_id: packData.category_id,
          category_name: (packData.categories as any)?.name || "Uncategorized",
          genres,
          tags: packData.tags || [],
          is_premium: packData.is_premium,
          status: packData.status,
          download_count: packData.download_count,
          created_at: packData.created_at,
          updated_at: packData.updated_at,
          samples_count: samplesData?.length || 0,
          sample_types: sampleTypes,
          has_stems: hasStems,
          preview_sample_url: previewSampleUrl,
        };

        setPack(packDetail);
      } catch (err: any) {
        console.error("Error fetching pack detail:", err);
        setError(err.message || "Failed to load pack details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPackDetail();
  }, [id]);

  // Audio player setup
  useEffect(() => {
    if (!pack?.preview_sample_url) return;

    const audio = new Audio(pack.preview_sample_url);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.volume = volume;

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [pack?.preview_sample_url]);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const confirmDisablePack = async () => {
    if (!pack || !id) return;

    try {
      setIsUpdatingStatus(true);
      setActionError(null);
      const { error } = await supabase
        .from("packs")
        .update({ status: "Disabled", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setPack({ ...pack, status: "Disabled" });
      setShowDisableDialog(false);
      setSuccessMessage("Pack disabled successfully");
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error disabling pack:", err);
      setActionError("Failed to disable pack: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmEnablePack = async () => {
    if (!pack || !id) return;

    try {
      setIsUpdatingStatus(true);
      setActionError(null);
      const { error } = await supabase
        .from("packs")
        .update({ status: "Published", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setPack({ ...pack, status: "Published" });
      setShowEnableDialog(false);
      setSuccessMessage("Pack published successfully");
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error enabling pack:", err);
      setActionError("Failed to enable pack: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmDeletePack = async () => {
    if (!pack || !id) return;

    try {
      setIsDeleting(true);
      setActionError(null);
      const { error } = await supabase.from("packs").delete().eq("id", id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setDeleteConfirmText(""); // Reset confirmation text
      navigate("/admin/library?tab=packs");
    } catch (err: any) {
      console.error("Error deleting pack:", err);
      setActionError("Failed to delete pack: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmText(""); // Reset confirmation text when dialog closes
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "default"; // Green
      case "Draft":
        return "secondary"; // Gray
      case "Disabled":
        return "destructive"; // Red
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading pack details...</span>
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Pack not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/library?tab=packs")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header / Hero */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/admin/library?tab=packs"
            className="hover:text-foreground transition"
          >
            Library
          </Link>
          <span>/</span>
          <Link
            to="/admin/library?tab=packs"
            className="hover:text-foreground transition"
          >
            Packs
          </Link>
          <span>/</span>
          <span className="text-foreground">{pack.name}</span>
        </div>

        {/* Header Content */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{pack.name}</h1>
              <Badge variant={getStatusBadgeVariant(pack.status)}>
                {pack.status}
              </Badge>
              {pack.is_premium && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>

            {/* Meta Line */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                to={`/admin/creators/${pack.creator_id}`}
                className="flex items-center gap-1.5 hover:text-foreground transition"
              >
                <User className="h-4 w-4" />
                {pack.creator_name}
              </Link>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Music className="h-4 w-4" />
                {pack.samples_count} {pack.samples_count === 1 ? "sample" : "samples"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(pack.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(`/admin/library/packs/${pack.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Pack
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isUpdatingStatus || isDeleting}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {pack.status === "Published" && (
                  <DropdownMenuItem onClick={() => setShowDisableDialog(true)} disabled={isUpdatingStatus}>
                    <Ban className="h-4 w-4 mr-2" />
                    Disable Pack
                  </DropdownMenuItem>
                )}
                {pack.status === "Disabled" && (
                  <DropdownMenuItem onClick={() => setShowEnableDialog(true)} disabled={isUpdatingStatus}>
                    <Check className="h-4 w-4 mr-2" />
                    Enable Pack
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => pack.download_count === 0 && setShowDeleteDialog(true)}
                  disabled={pack.download_count > 0 || isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Pack
                  {pack.download_count > 0 && " (has downloads)"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pack Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pack Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pack Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Cover & Description */}
                <div className="space-y-4">
                  {pack.cover_url ? (
                    <img
                      src={pack.cover_url}
                      alt={pack.name}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg border flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pack.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Right: Metadata */}
                <div className="space-y-4">
                  {/* Premium Badge */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Premium Pack</h4>
                    <Badge variant={pack.is_premium ? "default" : "outline"}>
                      {pack.is_premium ? "Yes" : "No"}
                    </Badge>
                  </div>

                  {/* Genres */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {pack.genres.length > 0 ? (
                        pack.genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No genres</span>
                      )}
                    </div>
                  </div>

                  {/* Categories / Types */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sample Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {pack.sample_types.length > 0 ? (
                        <>
                          {pack.sample_types.map((type) => (
                            <Badge key={type} variant="outline">
                              {type}
                            </Badge>
                          ))}
                          {pack.has_stems && (
                            <Badge variant="outline">Stems</Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">No samples</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {pack.tags.length > 0 ? (
                        pack.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price & Credits Block */}
          <Card>
            <CardHeader>
              <CardTitle>Credits & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Global Defaults */}
              <div>
                <h4 className="text-sm font-medium mb-2">Global Default Credit Costs</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">One-shots:</span>
                    <span className="font-medium">{getDefaultCreditCost("One-shot")} credits</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Loops:</span>
                    <span className="font-medium">{getDefaultCreditCost("Loop")} credits</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg col-span-2">
                    <span className="text-muted-foreground">Stems Bundle:</span>
                    <span className="font-medium">+{STEMS_BUNDLE_COST} credits</span>
                  </div>
                </div>
              </div>

              {/* Premium Status */}
              {pack.is_premium && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>This is a Premium pack.</strong> Premium credit costs apply:
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>One-shots: {getPremiumCreditCost("One-shot")} credits</div>
                      <div>Loops: {getPremiumCreditCost("Loop")} credits</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Pack-level override info */}
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                <strong>Note:</strong> Individual samples may have custom credit cost overrides.
                Default costs apply when no override is set.
              </div>
            </CardContent>
          </Card>

          {/* Pack Preview Player */}
          {pack.preview_sample_url && (
            <Card>
              <CardHeader>
                <CardTitle>Pack Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={togglePlayPause}
                    className="h-10 w-10"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(currentTime / duration) * 100 || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Preview: First sample from this pack
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata & Analytics */}
        <div className="space-y-6">
          {/* Creator & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Creator & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Creator */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Creator
                </h4>
                <Link
                  to={`/admin/creators/${pack.creator_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{pack.creator_name}</div>
                    <div className="text-xs text-muted-foreground">View profile →</div>
                  </div>
                </Link>
              </div>

              <Separator />

              {/* Release Date */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(pack.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(pack.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Category
                </h4>
                <Badge variant="outline">{pack.category_name}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Snippet */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* All-time Downloads */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    All-Time Downloads
                  </h4>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">{pack.download_count}</div>
              </div>

              {/* Last 30 Days (Placeholder) */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Last 30 Days
                  </h4>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
              </div>

              {/* Unique Users (Placeholder) */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Unique Users
                  </h4>
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {pack.preview_sample_url && (
                <Button className="w-full" onClick={togglePlayPause}>
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate(`/admin/library/packs/${pack.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Pack
                  </DropdownMenuItem>
                  {pack.status === "Published" && (
                    <DropdownMenuItem onClick={() => setShowDisableDialog(true)}>
                      <Ban className="h-4 w-4 mr-2" />
                      Disable Pack
                    </DropdownMenuItem>
                  )}
                  {pack.status === "Disabled" && (
                    <DropdownMenuItem onClick={() => setShowEnableDialog(true)}>
                      <Check className="h-4 w-4 mr-2" />
                      Enable Pack
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => pack.download_count === 0 && setShowDeleteDialog(true)}
                    disabled={pack.download_count > 0}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Pack
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Action Error Message */}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Disable Pack Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Pack?</AlertDialogTitle>
            <AlertDialogDescription>
              This pack and all samples inside it will be hidden from users. Previously 
              downloaded items remain available in user accounts. You can re-enable this 
              pack at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisablePack}
              disabled={isUpdatingStatus}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable Pack"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable Pack Confirmation Dialog */}
      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Pack?</AlertDialogTitle>
            <AlertDialogDescription>
              This pack and all Active samples inside it will become visible to users. 
              They will appear in search results and be available for download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEnablePack}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable Pack"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Pack Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pack?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p className="font-medium text-destructive">
                  This action is permanent and cannot be undone.
                </p>

                {pack && pack.download_count > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot delete: This pack has {pack.download_count} downloads.</strong>
                      <br />
                      Packs with download history cannot be deleted. Use "Disable Pack" instead.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <p className="font-medium mb-2">Deleting this pack will permanently remove:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        <li>The pack itself</li>
                        <li>All samples inside the pack</li>
                        <li>All metadata and associations</li>
                      </ul>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Previously downloaded samples will remain accessible to users in their download history.
                      </AlertDescription>
                    </Alert>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>⚠️ Deleting is irreversible.</strong> Use only when content must be 
                        permanently removed for legal or compliance reasons. <strong>"Disable Pack"</strong> is 
                        the recommended removal method.
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
                        disabled={isDeleting}
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePack}
              disabled={
                isDeleting || 
                (pack?.download_count || 0) > 0 || 
                deleteConfirmText.toLowerCase() !== "delete"
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Pack Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

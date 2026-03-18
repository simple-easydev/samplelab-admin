import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  X,
  Play,
  Pause,
  Trash2,
  FileAudio,
  Loader2,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { NewSamplesSection } from "@/components/library/NewSamplesSection";
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
import {
  uploadAudioFile,
  uploadPackCover,
  uploadMultipleAudioFiles,
  uploadSampleThumbnail,
  getCreators,
  getGenres,
  getCategories,
  type AudioUploadResult,
} from "@/lib/audio-upload";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  name: string;
}

interface Genre {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ExistingSample {
  id: string;
  name: string;
  audio_url: string;
  thumbnail_url: string | null;
  bpm: number | null;
  key: string | null;
  type: "Loop" | "One-shot";
  length: string | null;
  file_size_bytes: number | null;
  credit_cost: number | null;
  has_stems: boolean;
  status: string;
  // For editing
  isModified: boolean;
}

interface NewSampleFile {
  id: string;
  file: File;
  name: string;
  bpm: string;
  key: string;
  type: "Loop" | "One-shot";
  length: string;
  creditCost: string;
  hasStems: boolean;
  stemFiles: File[];
  thumbnailFile: File | null;
}

export default function EditPackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleIdToFocus = searchParams.get("sampleId");

  const [isLoadingPack, setIsLoadingPack] = useState(true);
  const [packNotFound, setPackNotFound] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    creator: "",
    genres: [] as string[],
    category: "",
    tags: [] as string[],
    coverUrl: "",
    isPremium: false,
    status: "Draft" as "Draft" | "Published" | "Disabled",
  });

  const [tagInput, setTagInput] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Existing samples from database
  const [existingSamples, setExistingSamples] = useState<ExistingSample[]>([]);
  const [samplesToDelete, setSamplesToDelete] = useState<string[]>([]);

  // New samples to add (NewSampleFile must match NewSamplesSection interface)
  const [newSampleFiles, setNewSampleFiles] = useState<NewSampleFile[]>([]);
  // Waveform data (bars + duration) per new sample id, for saving to samples.metadata
  const [newSampleWaveformMeta, setNewSampleWaveformMeta] = useState<
    Record<string, { bars: number[]; durationSeconds: number }>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    step: "",
    current: 0,
    total: 0,
    percentage: 0,
    message: "",
  });

  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reference data from Supabase
  const [creators, setCreators] = useState<Creator[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Dialog states
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<"save" | "publish" | "draft" | null>(null);

  // Alert/Error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedSampleId, setHighlightedSampleId] = useState<string | null>(null);
  const [savingSampleId, setSavingSampleId] = useState<string | null>(null);

  // Load reference data (creators, genres, categories)
  useEffect(() => {
    async function loadReferenceData() {
      try {
        setIsLoadingData(true);
        const [creatorsData, genresData, categoriesData] = await Promise.all([
          getCreators(),
          getGenres(),
          getCategories(),
        ]);

        setCreators(creatorsData);
        setGenres(genresData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading reference data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadReferenceData();
  }, []);

  // Load existing pack data
  useEffect(() => {
    if (!id) return;

    async function loadPackData() {
      try {
        setIsLoadingPack(true);

        // Fetch pack data with joins
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
            creators (name),
            categories (name)
          `
          )
          .eq("id", id)
          .single();

        if (packError) throw packError;
        if (!packData) {
          setPackNotFound(true);
          return;
        }

        // Fetch pack genres
        const { data: packGenres, error: genresError } = await supabase
          .from("pack_genres")
          .select("genre_id, genres (name)")
          .eq("pack_id", id);

        if (genresError) throw genresError;

        // Fetch samples (exclude Deleted samples - they're soft-deleted to preserve download history)
        const { data: samplesData, error: samplesError } = await supabase
          .from("samples")
          .select("*")
          .eq("pack_id", id)
          .neq("status", "Deleted") // Exclude soft-deleted samples
          .order("created_at", { ascending: true });

        if (samplesError) throw samplesError;

        // Populate form data
        setFormData({
          name: packData.name,
          description: packData.description || "",
          creator: packData.creator_id || "",
          genres: packGenres?.map((pg: any) => pg.genre_id) || [],
          category: packData.category_id || "",
          tags: packData.tags || [],
          coverUrl: packData.cover_url || "",
          isPremium: packData.is_premium,
          status: packData.status,
        });

        setCoverPreview(packData.cover_url);

        setExistingSamples(
          samplesData?.map((s: any) => ({
            ...s,
            isModified: false,
          })) || []
        );
      } catch (error: any) {
        console.error("Error loading pack:", error);
        setPackNotFound(true);
      } finally {
        setIsLoadingPack(false);
      }
    }

    loadPackData();
  }, [id]);

  const shouldFocusSample =
    !!sampleIdToFocus && existingSamples.some((s) => s.id === sampleIdToFocus);

  useEffect(() => {
    if (!shouldFocusSample || !sampleIdToFocus) return;

    const el = document.querySelector<HTMLElement>(
      `[data-sample-id="${sampleIdToFocus}"]`
    );

    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedSampleId(sampleIdToFocus);

    const t = window.setTimeout(() => setHighlightedSampleId(null), 2000);
    return () => window.clearTimeout(t);
  }, [shouldFocusSample, sampleIdToFocus]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleToggleGenre = (genreId: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((g) => g !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle new sample files
  const handleSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newSamples: NewSampleFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name.replace(/\.(wav|mp3)$/i, ""),
      bpm: "",
      key: "",
      type: "Loop",
      length: "",
      creditCost: "",
      hasStems: false,
      stemFiles: [],
      thumbnailFile: null,
    }));

    setNewSampleFiles((prev) => [...prev, ...newSamples]);
  };

  const handleRemoveNewSample = (sampleId: string) => {
    setNewSampleFiles((prev) => prev.filter((s) => s.id !== sampleId));
    setNewSampleWaveformMeta((prev) => {
      const next = { ...prev };
      delete next[sampleId];
      return next;
    });
  };

  const handleMarkExistingSampleForDeletion = (sampleId: string) => {
    setSamplesToDelete((prev) => [...prev, sampleId]);
  };

  const handleUnmarkSampleForDeletion = (sampleId: string) => {
    setSamplesToDelete((prev) => prev.filter((id) => id !== sampleId));
  };

  const handleUpdateExistingSample = (sampleId: string, field: string, value: any) => {
    setExistingSamples((prev) =>
      prev.map((sample) =>
        sample.id === sampleId
          ? { ...sample, [field]: value, isModified: true }
          : sample
      )
    );
  };

  const handleUpdateNewSample = (sampleId: string, field: string, value: any) => {
    setNewSampleFiles((prev) =>
      prev.map((sample) =>
        sample.id === sampleId ? { ...sample, [field]: value } : sample
      )
    );
  };

  // Persist edits for a single existing sample without saving the whole pack.
  const handleSaveSingleExistingSample = async (sampleId: string) => {
    const sample = existingSamples.find((s) => s.id === sampleId);
    if (!sample) return;
    if (samplesToDelete.includes(sampleId)) return;
    if (!sample.isModified) return;

    setSavingSampleId(sampleId);
    try {
      const { error } = await supabase
        .from("samples")
        .update({
          name: sample.name,
          bpm: sample.bpm,
          key: sample.key,
          type: sample.type,
          length: sample.length,
          credit_cost: sample.credit_cost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sample.id);

      if (error) throw error;

      setExistingSamples((prev) =>
        prev.map((s) => (s.id === sampleId ? { ...s, isModified: false } : s))
      );

      toast.success("Sample saved", { description: `Updated "${sample.name}"` });
    } catch (err: any) {
      console.error("Error saving sample:", err);
      toast.error("Failed to save sample", {
        description: err?.message || "Unknown error",
      });
    } finally {
      setSavingSampleId(null);
    }
  };

  const handleStemUpload = (sampleId: string, files: FileList | null, isNew: boolean) => {
    if (!files) return;
    const stemFiles = Array.from(files);

    if (isNew) {
      setNewSampleFiles((prev) =>
        prev.map((sample) =>
          sample.id === sampleId
            ? { ...sample, stemFiles, hasStems: true }
            : sample
        )
      );
    }
  };

  const handleRemoveStems = (sampleId: string, isNew: boolean) => {
    if (isNew) {
      setNewSampleFiles((prev) =>
        prev.map((sample) =>
          sample.id === sampleId
            ? { ...sample, stemFiles: [], hasStems: false }
            : sample
        )
      );
    }
  };

  const handleWaveformReady = useCallback(
    (sampleId: string, durationFormatted: string, waveformData?: { bars: number[]; durationSeconds: number }) => {
      setNewSampleFiles((prev) =>
        prev.map((s) =>
          s.id === sampleId && !s.length ? { ...s, length: durationFormatted } : s
        )
      );
      if (waveformData) {
        setNewSampleWaveformMeta((prev) => ({
          ...prev,
          [sampleId]: waveformData,
        }));
      }
    },
    []
  );

  const togglePlaySample = (sampleId: string, audioUrl: string) => {
    if (playingSampleId === sampleId) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingSampleId(null);
      setPlayingSampleId(sampleId);
    }
  };

  const validateForm = () => {
    setValidationError(null);
    if (!formData.name.trim()) {
      setValidationError("Please enter a pack name");
      return false;
    }
    if (!formData.creator) {
      setValidationError("Please select a creator");
      return false;
    }
    if (!formData.category) {
      setValidationError("Please select a category");
      return false;
    }
    if (formData.genres.length === 0) {
      setValidationError("Please select at least one genre");
      return false;
    }
    return true;
  };

  const performSave = async (newStatus?: "Draft" | "Published") => {
    if (!id) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setUploadProgress({
        step: "Preparing",
        current: 0,
        total: 100,
        percentage: 0,
        message: "Starting update...",
      });

      // 1. Upload new cover if changed
      let coverUrl = formData.coverUrl;
      if (coverFile) {
        setUploadProgress({
          step: "Uploading cover",
          current: 10,
          total: 100,
          percentage: 10,
          message: "Uploading cover image...",
        });

        const coverResult = await uploadPackCover(coverFile);
        if (!coverResult.success) {
          throw new Error(coverResult.error || "Failed to upload cover");
        }
        coverUrl = coverResult.url!;
      }

      // 2. Update pack metadata
      setUploadProgress({
        step: "Updating pack",
        current: 20,
        total: 100,
        percentage: 20,
        message: "Updating pack metadata...",
      });

      const statusToSave = newStatus || formData.status;

      const { error: packError } = await supabase
        .from("packs")
        .update({
          name: formData.name,
          description: formData.description,
          creator_id: formData.creator || null,
          cover_url: coverUrl,
          category_id: formData.category || null,
          tags: formData.tags,
          is_premium: formData.isPremium,
          status: statusToSave,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (packError) throw packError;

      // 3. Update pack genres (delete and re-insert)
      setUploadProgress({
        step: "Updating genres",
        current: 30,
        total: 100,
        percentage: 30,
        message: "Updating genres...",
      });

      await supabase.from("pack_genres").delete().eq("pack_id", id);

      if (formData.genres.length > 0) {
        const genreInserts = formData.genres.map((genreId) => ({
          pack_id: id,
          genre_id: genreId,
        }));
        await supabase.from("pack_genres").insert(genreInserts);
      }

      // 4. Soft delete marked samples (preserve download history)
      // Note: Samples are marked as "Deleted" status rather than hard deleted
      // This ensures users who previously downloaded these samples retain access
      if (samplesToDelete.length > 0) {
        setUploadProgress({
          step: "Removing samples",
          current: 40,
          total: 100,
          percentage: 40,
          message: `Removing ${samplesToDelete.length} sample(s) from pack...`,
        });

        // Soft delete: Change status to "Deleted" instead of removing from database
        await supabase
          .from("samples")
          .update({ 
            status: "Deleted",
            updated_at: new Date().toISOString()
          })
          .in("id", samplesToDelete);
      }

      // 5. Update modified existing samples
      const modifiedSamples = existingSamples.filter((s) => s.isModified && !samplesToDelete.includes(s.id));
      if (modifiedSamples.length > 0) {
        setUploadProgress({
          step: "Updating samples",
          current: 50,
          total: 100,
          percentage: 50,
          message: `Updating ${modifiedSamples.length} sample(s)...`,
        });

        for (const sample of modifiedSamples) {
          await supabase
            .from("samples")
            .update({
              name: sample.name,
              bpm: sample.bpm,
              key: sample.key,
              type: sample.type,
              length: sample.length,
              credit_cost: sample.credit_cost,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sample.id);
        }
      }

      // 6. Upload and add new samples
      if (newSampleFiles.length > 0) {
        setUploadProgress({
          step: "Uploading new samples",
          current: 60,
          total: 100,
          percentage: 60,
          message: `Uploading ${newSampleFiles.length} new sample(s)...`,
        });

        for (let i = 0; i < newSampleFiles.length; i++) {
          const sample = newSampleFiles[i];

          setUploadProgress({
            step: "Uploading sample",
            current: 60 + (i / newSampleFiles.length) * 30,
            total: 100,
            percentage: 60 + (i / newSampleFiles.length) * 30,
            message: `Uploading ${sample.name}...`,
          });

          // Upload main audio file
          const audioResult = await uploadAudioFile(sample.file, "samples");
          if (!audioResult.success) {
            throw new Error(`Failed to upload ${sample.name}: ${audioResult.error}`);
          }

          // Upload stems if present
          let stemResults: AudioUploadResult[] = [];
          if (sample.hasStems && sample.stemFiles.length > 0) {
            stemResults = await uploadMultipleAudioFiles(sample.stemFiles, "stems");
            const failedStems = stemResults.filter((r) => !r.success);
            if (failedStems.length > 0) {
              throw new Error(`Failed to upload stems for ${sample.name}`);
            }
          }

          // Upload thumbnail if present
          let thumbnailUrl: string | null = null;
          if (sample.thumbnailFile) {
            const thumbResult = await uploadSampleThumbnail(sample.thumbnailFile);
            if (thumbResult.success && thumbResult.url) {
              thumbnailUrl = thumbResult.url;
            }
          }

          // Build metadata from waveform (bars + duration) when available
          const waveformMeta = newSampleWaveformMeta[sample.id];
          const metadata =
            waveformMeta ?
              {
                bars: waveformMeta.bars,
                duration_seconds: waveformMeta.durationSeconds,
              }
            : null;

          // Insert sample into database
          const { data: sampleData, error: sampleError } = await supabase
            .from("samples")
            .insert({
              pack_id: id,
              name: sample.name,
              audio_url: audioResult.url!,
              bpm: sample.bpm ? parseInt(sample.bpm) : null,
              key: sample.key || null,
              type: sample.type,
              length: sample.length || null,
              file_size_bytes: sample.file.size,
              credit_cost: sample.creditCost ? parseInt(sample.creditCost) : null,
              has_stems: sample.hasStems,
              status: "Active",
              metadata,
              thumbnail_url: thumbnailUrl,
            })
            .select()
            .single();

          if (sampleError) throw sampleError;

          // Insert stems if present
          if (sample.hasStems && stemResults.length > 0 && sampleData) {
            const stemInserts = stemResults.map((stemResult, idx) => ({
              sample_id: sampleData.id,
              name: sample.stemFiles[idx].name,
              audio_url: stemResult.url!,
              file_size_bytes: sample.stemFiles[idx].size,
            }));

            await supabase.from("stems").insert(stemInserts);
          }
        }
      }

      setUploadProgress({
        step: "Complete",
        current: 100,
        total: 100,
        percentage: 100,
        message: "Pack updated successfully!",
      });

      // Show toast notification
      const statusMsg = 
        pendingSaveAction === "publish" ? "Pack published successfully!" :
        pendingSaveAction === "draft" ? "Pack saved as draft!" :
        "Pack updated successfully!";
      
      const description = 
        pendingSaveAction === "publish" ? "The pack is now live and available to users." :
        pendingSaveAction === "draft" ? "The pack has been saved as a draft." :
        "Your changes have been saved.";

      toast.success(statusMsg, {
        description: description,
        duration: 4000,
      });

      setTimeout(() => {
        navigate(`/admin/library/packs/${id}`);
      }, 1000);
    } catch (error: any) {
      console.error("Error updating pack:", error);
      setErrorMessage(`Error updating pack: ${error.message}`);
      setUploadProgress({
        step: "Error",
        current: 0,
        total: 100,
        percentage: 0,
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveClick = (action: "save" | "publish" | "draft") => {
    setPendingSaveAction(action);

    if (action === "publish" && formData.status === "Draft") {
      setShowStatusChangeDialog(true);
    } else if (action === "draft" && formData.status === "Published") {
      setShowStatusChangeDialog(true);
    } else {
      // Call confirmSave with the action directly to avoid state race condition
      confirmSave(action);
    }
  };

  const confirmSave = async (action?: "save" | "publish" | "draft") => {
    // Use passed action or fall back to pendingSaveAction state
    const saveAction = action || pendingSaveAction;
    setShowStatusChangeDialog(false);

    if (saveAction === "save") {
      await performSave();  
    } else if (saveAction === "publish") {
      await performSave("Published");
    } else if (saveAction === "draft") {
      await performSave("Draft");
    }

    setPendingSaveAction(null);
  };

  const getCreatorName = (creatorId: string) => {
    return creators.find((c) => c.id === creatorId)?.name || "Select creator";
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Select category";
  };

  const getSelectedGenresNames = () => {
    return formData.genres
      .map((gId) => genres.find((g) => g.id === gId)?.name)
      .filter(Boolean)
      .join(", ");
  };

  if (isLoadingPack || isLoadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading pack data...</span>
        </div>
      </div>
    );
  }

  if (packNotFound) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Pack not found</AlertDescription>
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

  const totalSamples = existingSamples.filter((s) => !samplesToDelete.includes(s.id)).length + newSampleFiles.length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/library/packs/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8" />
              Edit Pack
            </h1>
            <p className="text-muted-foreground mt-1">
              Editing: {formData.name || "Untitled Pack"}
            </p>
          </div>
        </div>
        <Badge variant={formData.status === "Published" ? "default" : "secondary"}>
          {formData.status}
        </Badge>
      </div>

      <Separator />

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Pack Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Metadata</CardTitle>
          <CardDescription>
            Edit name, description, genre, category, tags, and cover image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pack Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Trap Essentials Vol.1"
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {getCategoryName(formData.category)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleInputChange("category", category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your pack..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Genres * (Multi-select)</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {formData.genres.length > 0
                    ? getSelectedGenresNames()
                    : "Select genres"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select Genres</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {genres.map((genre) => (
                  <DropdownMenuCheckboxItem
                    key={genre.id}
                    checked={formData.genres.includes(genre.id)}
                    onCheckedChange={() => handleToggleGenre(genre.id)}
                  >
                    {genre.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {formData.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.genres.map((genreId) => {
                  const genre = genres.find((g) => g.id === genreId);
                  return genre ? (
                    <Badge key={genreId} variant="secondary">
                      {genre.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags (moods, styles)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="e.g., Dark, Vintage, Dusty"
              />
              <Button type="button" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Square image, at least 500x500px
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPremium"
              checked={formData.isPremium}
              onChange={(e) => handleInputChange("isPremium", e.target.checked ? "true" : "")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPremium" className="cursor-pointer">
              Premium Pack (Higher credit cost)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Creator Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Assignment</CardTitle>
          <CardDescription>Assign this pack to a creator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Creator *</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full max-w-md justify-start">
                  {getCreatorName(formData.creator)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select Creator</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {creators.map((creator) => (
                  <DropdownMenuItem
                    key={creator.id}
                    onClick={() => handleInputChange("creator", creator.id)}
                  >
                    {creator.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Existing Samples */}
      {existingSamples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Samples</CardTitle>
            <CardDescription>
              Edit sample metadata or mark for deletion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingSamples.map((sample) => {
              const markedForDeletion = samplesToDelete.includes(sample.id);

              return (
                <div
                  key={sample.id}
                  data-sample-id={sample.id}
                  className={`p-4 border rounded-lg ${
                    markedForDeletion ? "opacity-50 bg-destructive/5" : ""
                  } ${highlightedSampleId === sample.id ? "ring-2 ring-purple-500" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => togglePlaySample(sample.id, sample.audio_url)}
                        aria-label={playingSampleId === sample.id ? "Pause" : "Play"}
                        className={`relative shrink-0 rounded-md overflow-hidden border flex items-center justify-center bg-muted ${
                          sample.thumbnail_url ? "h-12 w-12" : "h-9 w-9 border-input"
                        }`}
                      >
                        {sample.thumbnail_url ? (
                          <>
                            <img
                              src={sample.thumbnail_url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <span className="relative z-10 flex items-center justify-center w-full h-full bg-black/30 text-white">
                              {playingSampleId === sample.id ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            {playingSampleId === sample.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </>
                        )}
                      </button>
                      <div>
                        <p className="font-medium">{sample.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sample.type} • {sample.bpm ? `${sample.bpm} BPM` : "No BPM"} •{" "}
                          {sample.key || "No key"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {markedForDeletion ? (
                        <>
                          <Badge variant="destructive">Marked for deletion</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnmarkSampleForDeletion(sample.id)}
                          >
                            Undo
                          </Button>
                        </>
                      ) : (
                        <>
                          {sample.isModified && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={savingSampleId === sample.id}
                              onClick={() => handleSaveSingleExistingSample(sample.id)}
                            >
                              {savingSampleId === sample.id ? "Saving..." : "Save"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleMarkExistingSampleForDeletion(sample.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!markedForDeletion && (
                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={sample.name}
                          onChange={(e) =>
                            handleUpdateExistingSample(sample.id, "name", e.target.value)
                          }
                          placeholder="Sample name"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">BPM</Label>
                        <Input
                          type="number"
                          value={sample.bpm || ""}
                          onChange={(e) =>
                            handleUpdateExistingSample(
                              sample.id,
                              "bpm",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          placeholder="120"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Key</Label>
                        <Input
                          value={sample.key || ""}
                          onChange={(e) =>
                            handleUpdateExistingSample(sample.id, "key", e.target.value)
                          }
                          placeholder="C"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-9">
                              {sample.type}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateExistingSample(sample.id, "type", "Loop")
                              }
                            >
                              Loop
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateExistingSample(sample.id, "type", "One-shot")
                              }
                            >
                              One-shot
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label className="text-xs">Credit Cost</Label>
                        <Input
                          type="number"
                          value={sample.credit_cost ?? ""}
                          onChange={(e) =>
                            handleUpdateExistingSample(
                              sample.id,
                              "credit_cost",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          placeholder="Auto"
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  {sample.has_stems && !markedForDeletion && (
                    <div className="mt-3">
                      <Badge variant="secondary">Has stems</Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add New Samples */}
      <NewSamplesSection
        newSampleFiles={newSampleFiles}
        isSubmitting={isSubmitting}
        onSampleUpload={handleSampleUpload}
        onRemoveNewSample={handleRemoveNewSample}
        onUpdateNewSample={handleUpdateNewSample}
        onStemUpload={(sampleId, files) => handleStemUpload(sampleId, files, true)}
        onRemoveStems={(sampleId) => handleRemoveStems(sampleId, true)}
        onWaveformReady={handleWaveformReady}
      />

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="text-lg font-semibold">{formData.status}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Samples</p>
              <p className="text-lg font-semibold">{totalSamples}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Premium</p>
              <p className="text-lg font-semibold">{formData.isPremium ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Save Changes</CardTitle>
          <CardDescription>
            Choose how to save your changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Always available: Save changes */}
          <Button
            className="w-full"
            onClick={() => handleSaveClick("save")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes (Keep status: {formData.status})
              </>
            )}
          </Button>

          {/* If Draft: Show "Save & Publish" */}
          {formData.status === "Draft" && (
            <Button
              className="w-full"
              variant="default"
              onClick={() => handleSaveClick("publish")}
              disabled={isSubmitting}
            >
              <Check className="h-4 w-4 mr-2" />
              Save & Publish (Draft → Published)
            </Button>
          )}

          {/* If Published: Show "Save as Draft" */}
          {formData.status === "Published" && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleSaveClick("draft")}
              disabled={isSubmitting}
            >
              Save as Draft (Published → Draft)
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/admin/library/packs/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isSubmitting && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{uploadProgress.step}</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress.message}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingSaveAction === "publish"
                ? "Publish this pack?"
                : "Save as Draft?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSaveAction === "publish"
                ? "This will make the pack visible to users after saving your changes."
                : "This will hide the pack from users after saving your changes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmSave()} disabled={isSubmitting}>
              {pendingSaveAction === "publish" ? "Publish" : "Save as Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

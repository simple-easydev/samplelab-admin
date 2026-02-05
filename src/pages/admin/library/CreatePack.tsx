import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Upload, X, Play, Pause, Trash2, FileAudio, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  uploadAudioFile,
  uploadPackCover,
  uploadMultipleAudioFiles,
  createPackWithSamples,
  getCreators,
  getGenres,
  getCategories,
  type AudioUploadResult,
} from "@/lib/audio-upload";

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

interface SampleFile {
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
}

export default function CreatePackPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    creator: "",
    genres: [] as string[],
    category: "",
    tags: [] as string[],
    coverUrl: "",
    isPremium: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleGenreToggle = (genreId: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(g => g !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  // Helper to get genre names for display
  const getSelectedGenreNames = () => {
    return formData.genres
      .map(id => genres.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  // Helper to get selected category name
  const getSelectedCategoryName = () => {
    return categories.find(c => c.id === formData.category)?.name || "";
  };

  // Helper to get selected creator name
  const getSelectedCreatorName = () => {
    return creators.find(c => c.id === formData.creator)?.name || "";
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the actual file for upload
      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch reference data on mount
  useEffect(() => {
    async function fetchReferenceData() {
      setIsLoadingData(true);
      try {
        const [creatorsData, genresData, categoriesData] = await Promise.all([
          getCreators(),
          getGenres(),
          getCategories(),
        ]);
        setCreators(creatorsData);
        setGenres(genresData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchReferenceData();
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newSamples: SampleFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name.replace(/\.[^/.]+$/, ""),
      bpm: "",
      key: "",
      type: "One-shot",
      length: "",
      creditCost: "",
      hasStems: false,
      stemFiles: [],
    }));
    setSampleFiles(prev => [...prev, ...newSamples]);
  };

  const handleRemoveSample = (id: string) => {
    setSampleFiles(prev => prev.filter(s => s.id !== id));
  };

  const handleSampleChange = (id: string, field: keyof SampleFile, value: any) => {
    setSampleFiles(prev =>
      prev.map(sample =>
        sample.id === id ? { ...sample, [field]: value } : sample
      )
    );
  };

  const handleStemUpload = (sampleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSampleFiles(prev =>
      prev.map(sample =>
        sample.id === sampleId ? { ...sample, stemFiles: files } : sample
      )
    );
  };

  const handlePlayPause = (sampleId: string) => {
    const sample = sampleFiles.find(s => s.id === sampleId);
    if (!sample) return;

    // If this sample is already playing, pause it
    if (playingSampleId === sampleId && audioRef.current) {
      audioRef.current.pause();
      setPlayingSampleId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create a new audio element and play the sample
    const audioUrl = URL.createObjectURL(sample.file);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.play().catch(error => {
      console.error("Error playing audio:", error);
      alert("Failed to play audio. Please check the file format.");
    });

    audio.onended = () => {
      setPlayingSampleId(null);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      setPlayingSampleId(null);
      URL.revokeObjectURL(audioUrl);
      alert("Error playing audio file.");
    };

    setPlayingSampleId(sampleId);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSaveDraft = async () => {
    // Basic validation
    if (!formData.name || !formData.creator || formData.genres.length === 0 || !formData.category) {
      alert("Please fill in all required fields (Name, Creator, Genre, Category)");
      return;
    }

    await createPack("Draft");
  };

  const handlePublish = async () => {
    // Validation
    if (!formData.name || !formData.creator || formData.genres.length === 0 || !formData.category) {
      alert("Please fill in all required fields (Name, Creator, Genre, Category)");
      return;
    }

    if (sampleFiles.length === 0) {
      alert("Please upload at least one sample file before publishing");
      return;
    }

    await createPack("Published");
  };

  const createPack = async (status: "Draft" | "Published") => {
    setIsSubmitting(true);
    
    // Calculate total steps
    const totalSteps = 5; // Initialize, cover, samples, stems, database
    let currentStep = 0;

    const updateProgress = (step: string, message: string, current?: number, total?: number) => {
      currentStep++;
      const percentage = Math.round((currentStep / totalSteps) * 100);
      setUploadProgress({
        step,
        current: current || 0,
        total: total || 0,
        percentage,
        message,
      });
    };

    try {
      // Step 1: Initialize
      updateProgress("Initializing", "Preparing upload...");
      
      // Step 2: Upload cover image if provided
      let coverUrl = "";
      if (coverFile) {
        updateProgress("Cover", "Uploading cover image...", 1, 1);
        const coverResult = await uploadPackCover(coverFile);
        if (!coverResult.success) {
          throw new Error(`Cover upload failed: ${coverResult.error}`);
        }
        coverUrl = coverResult.url!;
      } else {
        currentStep++; // Skip cover step if no file
      }

      // Step 3: Upload all sample audio files
      updateProgress("Samples", `Uploading samples...`, 0, sampleFiles.length);
      const sampleUploadPromises = sampleFiles.map((sample, index) =>
        uploadAudioFile(sample.file, "samples").then((result: AudioUploadResult) => {
          setUploadProgress(prev => ({
            ...prev,
            current: index + 1,
            message: `Uploading sample ${index + 1} of ${sampleFiles.length}...`,
          }));
          return result;
        })
      );
      const sampleUploadResults = await Promise.all(sampleUploadPromises);

      // Check for upload failures
      const failedUploads = sampleUploadResults.filter((r: AudioUploadResult) => !r.success);
      if (failedUploads.length > 0) {
        throw new Error(
          `${failedUploads.length} sample(s) failed to upload: ${failedUploads[0].error}`
        );
      }

      // Step 4: Upload stems for samples that have them
      const samplesWithStems = sampleFiles.filter((s) => s.hasStems && s.stemFiles.length > 0);
      const totalStemFiles = samplesWithStems.reduce((acc, s) => acc + s.stemFiles.length, 0);
      let stemUploadResults: AudioUploadResult[][] = [];
      
      if (totalStemFiles > 0) {
        updateProgress("Stems", "Uploading stem files...", 0, totalStemFiles);
        let stemsUploaded = 0;
        const stemUploadPromises = samplesWithStems.map((sample) =>
          uploadMultipleAudioFiles(sample.stemFiles, "stems").then((results: AudioUploadResult[]) => {
            stemsUploaded += results.length;
            setUploadProgress(prev => ({
              ...prev,
              current: stemsUploaded,
              message: `Uploading stems ${stemsUploaded} of ${totalStemFiles}...`,
            }));
            return results;
          })
        );
        stemUploadResults = await Promise.all(stemUploadPromises);
      } else {
        currentStep++; // Skip stems step if none
      }

      // Step 5: Build samples data array with uploaded URLs
      const samplesData = sampleFiles.map((sample, index) => {
        const uploadResult = sampleUploadResults[index];

        // Find stems for this sample
        let stems: { name: string; audio_url: string; file_size_bytes?: number }[] = [];
        if (sample.hasStems && sample.stemFiles.length > 0) {
          const stemIndex = samplesWithStems.indexOf(sample);
          if (stemIndex >= 0) {
            stems = stemUploadResults[stemIndex]
              .filter((r: AudioUploadResult) => r.success)
              .map((result: AudioUploadResult, i: number) => ({
                name: sample.stemFiles[i].name,
                audio_url: result.url!,
                file_size_bytes: sample.stemFiles[i].size,
              }));
          }
        }

        return {
          name: sample.name,
          audio_url: uploadResult.url!,
          bpm: sample.bpm ? parseInt(sample.bpm) : undefined,
          key: sample.key || undefined,
          type: sample.type,
          length: sample.length || undefined,
          file_size_bytes: sample.file.size,
          credit_cost: sample.creditCost ? parseInt(sample.creditCost) : undefined,
          has_stems: sample.hasStems && stems.length > 0,
          stems,
        };
      });

      // Step 5: Create the pack in database
      updateProgress("Database", "Creating pack in database...", 1, 1);
      const result = await createPackWithSamples(
        {
          name: formData.name,
          description: formData.description,
          creator_id: formData.creator, // This is now the UUID from dropdown
          cover_url: coverUrl,
          category_id: formData.category, // This is now the UUID from dropdown
          tags: formData.tags,
          is_premium: formData.isPremium,
          status,
          genres: formData.genres, // Array of genre UUIDs
        },
        samplesData
      );

      if (!result.success) {
        throw new Error(`Pack creation failed: ${result.error}`);
      }

      // Success!
      setUploadProgress({
        step: "Complete",
        current: 1,
        total: 1,
        percentage: 100,
        message: status === "Draft" ? "Pack saved as draft!" : "Pack published successfully!",
      });
      
      // Small delay to show completion message
      setTimeout(() => {
        alert(
          status === "Draft"
            ? `Pack "${formData.name}" saved as draft!`
            : `Pack "${formData.name}" published successfully!`
        );
        navigate("/admin/library?tab=packs");
      }, 500);
    } catch (error) {
      console.error("Error creating pack:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the pack"
      );
    } finally {
      setIsSubmitting(false);
      // Reset progress after navigation or error
      setTimeout(() => {
        setUploadProgress({
          step: "",
          current: 0,
          total: 0,
          percentage: 0,
          message: "",
        });
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/library?tab=packs")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Pack</h1>
          <p className="text-muted-foreground mt-1">Create a new sample pack for your library</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="ml-2">
            Loading creators, genres, and categories...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form - Left Side (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pack Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Pack Metadata</CardTitle>
              <CardDescription>Essential details about the pack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pack Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Pack Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Trap Essentials Vol.1"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe your pack..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Genre (multi-select) */}
              <div className="space-y-2">
                <Label>Genre(s) * (multi-select)</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={isLoadingData}
                    >
                      {isLoadingData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : formData.genres.length > 0 ? (
                        getSelectedGenreNames()
                      ) : (
                        "Select genres..."
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuLabel>Select Genres (multi-select)</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {genres.map(genre => (
                      <DropdownMenuCheckboxItem
                        key={genre.id}
                        checked={formData.genres.includes(genre.id)}
                        onCheckedChange={() => handleGenreToggle(genre.id)}
                      >
                        {genre.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {formData.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.genres.map(genreId => {
                      const genre = genres.find(g => g.id === genreId);
                      return genre ? (
                        <Badge key={genreId} variant="outline" className="gap-1">
                          {genre.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleGenreToggle(genreId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Category (one-shot / loops / drums / vocals) */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={isLoadingData}
                    >
                      {isLoadingData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        getSelectedCategoryName() || "Select category..."
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map(category => (
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

              {/* Tags (optional) */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
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

              <Separator />

              {/* Assign Creator */}
              <div className="space-y-2">
                <Label>Assign Creator *</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={isLoadingData}
                    >
                      {isLoadingData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        getSelectedCreatorName() || "Select creator..."
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuLabel>Select Creator</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {creators.map(creator => (
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

              {/* Premium Pack Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-base font-medium">Premium Pack Toggle</Label>
                  <p className="text-sm text-muted-foreground">
                    Premium packs require special access or subscription
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.isPremium ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                >
                  {formData.isPremium ? "Premium" : "Standard"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Audio Files */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio Files</CardTitle>
              <CardDescription>Upload multiple files (WAV / MP3)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              <div>
                <Label htmlFor="audio-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <FileAudio className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload multiple audio files
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      WAV / MP3 files
                    </p>
                  </div>
                </Label>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*,.wav,.mp3"
                  multiple
                  className="hidden"
                  onChange={handleAudioUpload}
                />
              </div>

              {/* Sample Files List with Metadata */}
              {sampleFiles.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <p className="text-sm font-medium">
                    {sampleFiles.length} sample{sampleFiles.length !== 1 ? "s" : ""} uploaded
                  </p>
                  
                  {sampleFiles.map((sample, index) => (
                    <Card key={sample.id} className="bg-muted/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">Sample #{index + 1}</p>
                            <p className="text-xs text-muted-foreground truncate">{sample.file.name}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSample(sample.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Sample Name</Label>
                            <Input
                              placeholder="Sample name"
                              value={sample.name}
                              onChange={(e) => handleSampleChange(sample.id, "name", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                                  {sample.type}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleSampleChange(sample.id, "type", "Loop")}>
                                  Loop
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSampleChange(sample.id, "type", "One-shot")}>
                                  One-shot
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">BPM</Label>
                            <Input
                              type="number"
                              placeholder="BPM"
                              value={sample.bpm}
                              onChange={(e) => handleSampleChange(sample.id, "bpm", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Key</Label>
                            <Input
                              placeholder="e.g., Am"
                              value={sample.key}
                              onChange={(e) => handleSampleChange(sample.id, "key", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Length</Label>
                            <Input
                              placeholder="e.g., 2:30"
                              value={sample.length}
                              onChange={(e) => handleSampleChange(sample.id, "length", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Credit Cost Override (optional)</Label>
                          <Input
                            type="number"
                            placeholder="Leave empty for default cost"
                            value={sample.creditCost}
                            onChange={(e) => handleSampleChange(sample.id, "creditCost", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Has Stems Toggle */}
                        <div className="flex items-center justify-between p-3 bg-background border rounded-md">
                          <div>
                            <Label className="text-sm">Has stems?</Label>
                            <p className="text-xs text-muted-foreground">If yes = upload stems (multiple files)</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={sample.hasStems ? "default" : "outline"}
                            onClick={() => handleSampleChange(sample.id, "hasStems", !sample.hasStems)}
                          >
                            {sample.hasStems ? "Yes" : "No"}
                          </Button>
                        </div>

                        {/* Stem Files Upload */}
                        {sample.hasStems && (
                          <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                            <Label htmlFor={`stems-${sample.id}`} className="text-xs cursor-pointer">
                              <div className="border border-dashed rounded p-3 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                                <p className="text-xs text-gray-600">Upload stem files</p>
                              </div>
                            </Label>
                            <Input
                              id={`stems-${sample.id}`}
                              type="file"
                              accept="audio/*,.wav,.mp3"
                              multiple
                              className="hidden"
                              onChange={(e) => handleStemUpload(sample.id, e)}
                            />
                            {sample.stemFiles.length > 0 && (
                              <div className="space-y-1">
                                {sample.stemFiles.map((stem, i) => (
                                  <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileAudio className="h-3 w-3" />
                                    {stem.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Check */}
          {sampleFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quality Check</CardTitle>
                <CardDescription>Play previews inside admin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleFiles.map((sample, index) => {
                    const isPlaying = playingSampleId === sample.id;
                    return (
                      <div key={sample.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Button
                          type="button"
                          variant={isPlaying ? "default" : "outline"}
                          size="icon"
                          className="shrink-0"
                          onClick={() => handlePlayPause(sample.id)}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{sample.name || `Sample ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {sample.type} {sample.bpm && `• ${sample.bpm} BPM`} {sample.key && `• ${sample.key}`}
                          </p>
                        </div>
                        {sample.hasStems && (
                          <Badge variant="secondary" className="text-xs">
                            {sample.stemFiles.length} stems
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cover Image - Right Side (1 column) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image Upload</CardTitle>
              <CardDescription>Pack artwork (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Preview */}
              <div className="w-full aspect-square bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-20 w-20 text-white opacity-50" />
                )}
              </div>

              {/* Upload Button */}
              <div>
                <Label
                  htmlFor="cover-upload"
                  className="cursor-pointer"
                >
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload cover image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>

              {coverPreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCoverPreview(null);
                    setCoverFile(null);
                    setFormData(prev => ({ ...prev, coverUrl: "" }));
                  }}
                >
                  Remove Image
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pack Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pack Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Samples:</span>
                <span className="font-medium">{sampleFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant={formData.isPremium ? "default" : "secondary"}>
                  {formData.isPremium ? "Premium" : "Standard"}
                </Badge>
              </div>
              {formData.genres.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Genres:</span>
                  <span className="font-medium">{formData.genres.length}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Upload samples with metadata</p>
                <p>• Preview before publishing</p>
                <p>• Save as draft or publish live</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Progress Alert */}
      {uploadProgress.message && (
        <Alert className="border-blue-200 bg-blue-50">
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-3">
              {uploadProgress.step !== "Complete" ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-blue-900">
                    {uploadProgress.step} {uploadProgress.percentage > 0 && `(${uploadProgress.percentage}%)`}
                  </p>
                  {uploadProgress.total > 0 && (
                    <span className="text-xs text-blue-700">
                      {uploadProgress.current} / {uploadProgress.total}
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700">{uploadProgress.message}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            {uploadProgress.percentage > 0 && (
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6 p-4 border-t bg-muted/30 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/admin/library?tab=packs")}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isLoadingData}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting || isLoadingData}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Pack"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Package, Upload, X, Loader2 } from "lucide-react";
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
  uploadPackCover,
  createPackWithSamples,
  getCreators,
  getGenres,
  getCategories,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    step: "",
    current: 0,
    total: 0,
    percentage: 0,
    message: "",
  });

  // Alert/Error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSaveDraft = async () => {
    // Basic validation
    setValidationError(null);
    if (!formData.name || !formData.creator || formData.genres.length === 0 || !formData.category) {
      setValidationError("Please fill in all required fields (Name, Creator, Genre, Category)");
      return;
    }

    await createPack("Draft");
  };

  const handlePublish = async () => {
    // Validation
    setValidationError(null);
    if (!formData.name || !formData.creator || formData.genres.length === 0 || !formData.category) {
      setValidationError("Please fill in all required fields (Name, Creator, Genre, Category)");
      return;
    }

    await createPack("Published");
  };

  const createPack = async (status: "Draft" | "Published") => {
    setIsSubmitting(true);
    
    // Calculate total steps
    const totalSteps = 3; // Initialize, cover, database
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
        const coverResult = await uploadPackCover(coverFile, formData.name);
        if (!coverResult.success) {
          throw new Error(`Cover upload failed: ${coverResult.error}`);
        }
        coverUrl = coverResult.url!;
      } else {
        currentStep++; // Skip cover step if no file
      }

      // Step 3: Create the pack in database
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
        []
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
      
      // Show toast notification
      toast.success(
        status === "Draft"
          ? `Pack "${formData.name}" saved as draft!`
          : `Pack "${formData.name}" published successfully!`,
        {
          description: status === "Draft"
            ? "You can edit and publish it later." 
            : "The pack is now live and available to users.",
          duration: 4000,
        }
      );
      
      // Navigate after a short delay to show the toast
      setTimeout(() => {
        navigate("/admin/library?tab=packs");
      }, 1000);
    } catch (error) {
      console.error("Error creating pack:", error);
      setErrorMessage(
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
                <span className="text-muted-foreground">Audio Upload:</span>
                <span className="font-medium">Handled in dedicated software</span>
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
                <p>• Create pack metadata</p>
                <p>• Upload audio in dedicated software</p>
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

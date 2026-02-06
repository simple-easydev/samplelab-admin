import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  UserCircle,
  Loader2,
  AlertCircle,
  Save,
  X as XIcon,
  Package,
  Music,
  Download,
  Image as ImageIcon,
  Mail,
  User,
  Upload,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/audio-upload";

interface CreatorFormData {
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  is_active: boolean;
}

interface TopSample {
  id: string;
  name: string;
  type: "Loop" | "One-shot";
  downloads: number;
  pack_name: string;
}

interface TopPack {
  id: string;
  name: string;
  downloads: number;
  samples_count: number;
}

interface AssignedPack {
  id: string;
  name: string;
  cover_url: string | null;
  samples_count: number;
  status: "Draft" | "Published" | "Disabled";
  download_count: number;
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewCreator = !id || id === "new";

  const [isLoading, setIsLoading] = useState(!isNewCreator);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatorFormData>({
    name: "",
    email: "",
    bio: "",
    avatar_url: "",
    is_active: true,
  });

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Stats for existing creators
  const [topSamples, setTopSamples] = useState<TopSample[]>([]);
  const [topPacks, setTopPacks] = useState<TopPack[]>([]);
  const [assignedPacks, setAssignedPacks] = useState<AssignedPack[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load creator data if editing
  useEffect(() => {
    if (!isNewCreator && id) {
      loadCreatorData(id);
    }
  }, [id, isNewCreator]);

  async function loadCreatorData(creatorId: string) {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch creator basic info
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("id", creatorId)
        .single();

      if (creatorError) throw creatorError;

      if (creatorData) {
        setFormData({
          name: creatorData.name,
          email: creatorData.email || "",
          bio: creatorData.bio || "",
          avatar_url: creatorData.avatar_url || "",
          is_active: creatorData.is_active,
        });

        // Load stats and packs
        loadCreatorStats(creatorId);
      }
    } catch (err: any) {
      console.error("Error loading creator:", err);
      setError("Failed to load creator: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCreatorStats(creatorId: string) {
    try {
      setIsLoadingStats(true);

      // Fetch assigned packs
      const { data: packsData, error: packsError } = await supabase
        .from("packs")
        .select("*")
        .eq("creator_id", creatorId)
        .order("download_count", { ascending: false });

      if (packsError) throw packsError;

      // Get samples count for each pack
      const packsWithCounts = await Promise.all(
        (packsData || []).map(async (pack) => {
          const { count } = await supabase
            .from("samples")
            .select("*", { count: "exact", head: true })
            .eq("pack_id", pack.id)
            .in("status", ["Active", "Disabled"]);

          return {
            id: pack.id,
            name: pack.name,
            cover_url: pack.cover_url,
            samples_count: count || 0,
            status: pack.status as "Draft" | "Published" | "Disabled",
            download_count: pack.download_count || 0,
          };
        })
      );

      setAssignedPacks(packsWithCounts);

      // Get top packs (top 5)
      const topPacksData = packsWithCounts
        .filter((p) => p.status === "Published")
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          name: p.name,
          downloads: p.download_count,
          samples_count: p.samples_count,
        }));

      setTopPacks(topPacksData);

      // Fetch top samples from all packs
      if (packsData && packsData.length > 0) {
        const packIds = packsData.map((p) => p.id);

        // Get samples with their pack names
        const { data: samplesData, error: samplesError } = await supabase
          .from("samples")
          .select(`
            id,
            name,
            type,
            pack_id,
            packs!inner(name, download_count)
          `)
          .in("pack_id", packIds)
          .eq("status", "Active")
          .order("created_at", { ascending: false })
          .limit(100);

        if (samplesError) throw samplesError;

        // Calculate sample downloads based on pack downloads
        // (simplified: using pack downloads as proxy)
        const samplesWithDownloads = (samplesData || []).map((sample: any) => ({
          id: sample.id,
          name: sample.name,
          type: sample.type as "Loop" | "One-shot",
          pack_name: sample.packs.name,
          downloads: sample.packs.download_count || 0,
        }));

        // Sort by downloads and take top 5
        const topSamplesData = samplesWithDownloads
          .sort((a, b) => b.downloads - a.downloads)
          .slice(0, 5);

        setTopSamples(topSamplesData);
      }
    } catch (err: any) {
      console.error("Error loading creator stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData({ ...formData, avatar_url: "" });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Creator name is required");
      return;
    }

    try {
      setIsSaving(true);

      // Upload avatar if a new file was selected
      let finalAvatarUrl = formData.avatar_url;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const uploadResult = await uploadAvatar(avatarFile);
        setIsUploadingAvatar(false);

        if (!uploadResult.success) {
          toast.error("Avatar upload failed: " + uploadResult.error);
          setIsSaving(false);
          return;
        }

        finalAvatarUrl = uploadResult.url || "";
      }

      if (isNewCreator) {
        // Create new creator
        // @ts-expect-error - Supabase type inference issue
        const { data, error } = await supabase
          .from("creators")
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            bio: formData.bio.trim() || null,
            avatar_url: finalAvatarUrl.trim() || null,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Creator created successfully!", {
          description: `"${formData.name}" has been added.`,
        });

        // Navigate to the creator list
        navigate("/admin/creators");
      } else {
        // Update existing creator
        const { error } = await supabase
          .from("creators")
          // @ts-expect-error - Supabase type inference issue
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            bio: formData.bio.trim() || null,
            avatar_url: finalAvatarUrl.trim() || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;

        toast.success("Creator updated successfully!", {
          description: `Changes to "${formData.name}" have been saved.`,
        });

        // Reload data
        if (id) loadCreatorData(id);
      }
    } catch (err: any) {
      console.error("Error saving creator:", err);
      toast.error("Failed to save creator: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/creators");
  };

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
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading creator...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/creators")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Creator Profile</h1>
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/creators")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewCreator ? "Create New Creator" : "Edit Creator"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isNewCreator
                ? "Add a new creator profile"
                : `Editing: ${formData.name || "Creator"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <XIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Creator
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Basic Info
          </CardTitle>
          <CardDescription>
            Creator profile information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-muted-foreground">(Internal only)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isSaving}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Not shown on frontend
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  Bio <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Short description or bio..."
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Shown on frontend creator profile
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar / Photo</Label>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview || formData.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {formData.name ? getInitials(formData.name) : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          disabled={isSaving || isUploadingAvatar}
                        >
                          {isUploadingAvatar ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                        {(avatarPreview || formData.avatar_url) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={isSaving || isUploadingAvatar}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF, or WebP. Max 5MB.
                      </p>
                    </div>

                    <Separator className="my-2" />

                    {/* URL Input (Alternative) */}
                    <div className="space-y-2">
                      <Label htmlFor="avatar-url" className="text-xs text-muted-foreground">
                        Or enter image URL:
                      </Label>
                      <Input
                        id="avatar-url"
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.avatar_url}
                        onChange={(e) => {
                          setFormData({ ...formData, avatar_url: e.target.value });
                          setAvatarPreview(null);
                          setAvatarFile(null);
                        }}
                        disabled={isSaving || isUploadingAvatar || !!avatarFile}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.is_active ? "active" : "disabled"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_active: value === "active" })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="disabled">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        Disabled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.is_active
                    ? "Creator is active and can be assigned to packs"
                    : "Creator is disabled and unavailable for new assignments"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content - Only show for existing creators */}
      {!isNewCreator && id && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-blue-500" />
                Top Performing Content
              </CardTitle>
              <CardDescription>
                Highest performing samples and packs by downloads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Top Samples */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Top Samples</h3>
                    {topSamples.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No published samples yet
                      </p>
                    ) : (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sample Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Pack</TableHead>
                              <TableHead className="text-right">Downloads</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topSamples.map((sample) => (
                              <TableRow key={sample.id}>
                                <TableCell className="font-medium">
                                  {sample.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{sample.type}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {sample.pack_name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Download className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono">{sample.downloads}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Top Packs */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Top Packs</h3>
                    {topPacks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No published packs yet
                      </p>
                    ) : (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Pack Name</TableHead>
                              <TableHead className="text-center">Samples</TableHead>
                              <TableHead className="text-right">Downloads</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topPacks.map((pack) => (
                              <TableRow key={pack.id}>
                                <TableCell className="font-medium">
                                  {pack.name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-mono">{pack.samples_count}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Download className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono">{pack.downloads}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assigned Packs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Assigned Packs
              </CardTitle>
              <CardDescription>
                All packs created by this creator ({assignedPacks.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : assignedPacks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No packs yet</p>
                  <p className="text-sm mt-2">
                    This creator hasn't created any packs yet
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Cover</TableHead>
                        <TableHead>Pack Name</TableHead>
                        <TableHead className="text-center">Samples</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Downloads</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedPacks.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell>
                            <div className="h-12 w-12 rounded border overflow-hidden bg-muted flex items-center justify-center">
                              {pack.cover_url ? (
                                <img
                                  src={pack.cover_url}
                                  alt={pack.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{pack.name}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono">{pack.samples_count}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                pack.status === "Published"
                                  ? "default"
                                  : pack.status === "Draft"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {pack.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Download className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono">{pack.download_count}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

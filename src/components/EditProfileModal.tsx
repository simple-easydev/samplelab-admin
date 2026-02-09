import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: string;
  };
  onSuccess?: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Profile fields
  const [name, setName] = useState(user.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form when user changes
    setName(user.name || "");
    setAvatarUrl(user.avatar_url || "");
    setAvatarPreview(null);
    setAvatarFile(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [user]);

  // Get the full avatar URL from Supabase storage
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveAvatar = async () => {
    // If there's an existing avatar, delete it from storage
    if (avatarUrl) {
      try {
        const { error } = await supabase.storage
          .from("avatars")
          .remove([avatarUrl]);
        
        if (error) throw error;
      } catch (error) {
        console.error("Error removing avatar from storage:", error);
      }
    }
    
    setAvatarUrl("");
    setAvatarPreview(null);
    setAvatarFile(null);
    
    // Update user record to remove avatar URL
    try {
      const { error } = await supabase
        .from("users")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({ avatar_url: null })
        .eq("id", user.id);
      
      if (error) throw error;
      toast.success("Avatar removed");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error?.message || "Failed to remove avatar");
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        await supabase.storage.from("avatars").remove([avatarUrl]);
      }

      // Upload new avatar
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error?.message || "Failed to upload avatar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedPath = await uploadAvatar();
        if (uploadedPath) {
          newAvatarUrl = uploadedPath;
        } else {
          throw new Error("Failed to upload avatar");
        }
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("users")
        // @ts-expect-error - Supabase generated types may be out of sync
        .update({
          name,
          avatar_url: newAvatarUrl || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        // Verify current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          toast.error("Current password is incorrect");
          setLoading(false);
          return;
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;
        
        toast.success("Profile and password updated successfully");
      } else {
        toast.success("Profile updated successfully");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const displayAvatarUrl = avatarPreview || getAvatarUrl(avatarUrl);
  const isFullAdmin = user.role === "full_admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and security settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload Section */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-start gap-4">
              {/* Avatar Preview */}
              <div className="relative">
                {displayAvatarUrl ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                    <img
                      src={displayAvatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold border-2 border-border">
                    {name ? name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 2MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              {!isFullAdmin && (
                <p className="text-xs text-muted-foreground">
                  Email can only be changed by a Super Admin
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Password Management */}
          <div className="space-y-4">
            <h3 className="font-semibold">Password Management</h3>
            <Alert>
              <AlertDescription>
                Leave blank if you don't want to change your password
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

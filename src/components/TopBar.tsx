import { useState, useEffect } from "react";
import { Search, User, LogOut, HelpCircle, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import EditProfileModal from "@/components/EditProfileModal";
import type { User as UserType } from "@/types";

export default function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setCurrentUser(data as UserType);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log("Search query:", searchQuery);
  };

  // Get avatar URL from storage
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  // Generate initials from name or email
  const getInitials = () => {
    if (currentUser?.name) {
      return currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser?.email?.[0]?.toUpperCase() || "A";
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "disabled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role === "full_admin" ? "Super Admin" : "Content Editor";
  };

  const avatarUrl = getAvatarUrl(currentUser?.avatar_url || null);
  const displayName = currentUser?.name || "Admin User";
  const displayEmail = currentUser?.email || "admin@samplelab.com";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      {/* Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
      </div>

      {/* Global Search - Desktop */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search packs, samples, users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </form>

      {/* Mobile Search Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden ml-auto"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
      >
        {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </Button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="hidden sm:flex items-center gap-2 hover:bg-accent shrink-0 ml-auto"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                {getInitials()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {displayEmail}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-start gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
                {currentUser && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge
                      variant={getStatusVariant(currentUser.status)}
                      className="text-xs"
                    >
                      {currentUser.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatRole(currentUser.role)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              window.open(
                "https://notion.so/your-internal-docs",
                "_blank"
              )
            }
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile User Avatar Only */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden shrink-0"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                {getInitials()}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-start gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
                {currentUser && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge
                      variant={getStatusVariant(currentUser.status)}
                      className="text-xs"
                    >
                      {currentUser.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatRole(currentUser.role)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              window.open(
                "https://notion.so/your-internal-docs",
                "_blank"
              )
            }
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-background border-b p-4 z-50">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search packs, samples, users…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {/* Edit Profile Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            avatar_url: currentUser.avatar_url,
            role: currentUser.role,
          }}
          onSuccess={fetchCurrentUser}
        />
      )}
    </header>
  );
}

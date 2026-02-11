import {
  LayoutDashboard,
  Library,
  Package,
  Music,
  Tag,
  Folder,
  Heart,
  Users,
  UserCircle,
  CreditCard,
  Layers,
  ScrollText,
  Clock,
  ShoppingCart,
  Megaphone,
  LayoutTemplate,
  MessageSquare,
  ShieldCheck,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  hoverColor?: string;
  items?: SubNavigationItem[];
  requiredRole?: "full_admin" | "content_editor";
}

export interface SubNavigationItem {
  name: string;
  href: string;
  icon?: LucideIcon;
}

export const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    name: "Library",
    href: "/admin/library",
    icon: Library,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    hoverColor: "hover:bg-purple-500/20",
    items: [
      { name: "Packs", href: "/admin/library?tab=packs", icon: Package },
      { name: "Samples", href: "/admin/library?tab=samples", icon: Music },
      { name: "Genres", href: "/admin/library?tab=genres", icon: Tag },
      { name: "Categories", href: "/admin/library?tab=categories", icon: Folder },
      { name: "Moods", href: "/admin/library?tab=moods", icon: Heart },
    ],
  },
  {
    name: "Creators",
    href: "/admin/creators",
    icon: UserCircle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    hoverColor: "hover:bg-amber-500/20",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    hoverColor: "hover:bg-green-500/20",
  },
  {
    name: "Plans & Credits",
    href: "/admin/plans",
    icon: CreditCard,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverColor: "hover:bg-emerald-500/20",
    items: [
      { name: "Plan tiers", href: "/admin/plans/tiers", icon: Layers },
      { name: "Credit rules", href: "/admin/plans/credit-rules", icon: ScrollText },
      { name: "Trial settings", href: "/admin/plans/trials-settings", icon: Clock },
      { name: "Top-up packs", href: "/admin/plans/top-up-packs", icon: ShoppingCart },
    ],
  },
  {
    name: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    hoverColor: "hover:bg-orange-500/20",
    items: [
      { name: "Banner", href: "/admin/announcements?tab=banner", icon: LayoutTemplate },
      { name: "Pop-ups", href: "/admin/announcements?tab=popups", icon: MessageSquare },
    ],
  },
  {
    name: "Admin & Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverColor: "hover:bg-red-500/20",
    requiredRole: "full_admin",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    hoverColor: "hover:bg-gray-500/20",
    requiredRole: "full_admin",
  },
];

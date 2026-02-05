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
      { name: "Packs", href: "/admin/library/packs", icon: Package },
      { name: "Samples", href: "/admin/library/samples", icon: Music },
      { name: "Genres", href: "/admin/library/genres", icon: Tag },
      { name: "Categories", href: "/admin/library/categories", icon: Folder },
      { name: "Moods", href: "/admin/library/moods", icon: Heart },
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
      { name: "Trial settings", href: "/admin/plans/trial-settings", icon: Clock },
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
      { name: "Banner", href: "/admin/announcements/banner", icon: LayoutTemplate },
      { name: "Pop-ups", href: "/admin/announcements/popups", icon: MessageSquare },
    ],
  },
  {
    name: "Admin & Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverColor: "hover:bg-red-500/20",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    hoverColor: "hover:bg-gray-500/20",
  },
];

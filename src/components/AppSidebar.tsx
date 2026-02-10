import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { sidebarTheme } from "@/config/theme";
import { navigation } from "@/config/navigation";

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    async function getUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setRoleLoaded(true);
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single<{ role: string }>();

        console.log("User role loaded:", userData?.role);
        setUserRole(userData?.role || null);
        setRoleLoaded(true);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRoleLoaded(true);
      }
    }

    getUserRole();
  }, []);

  // Filter navigation items based on user role
  const filteredNavigation = roleLoaded 
    ? navigation.filter(item => {
        // If no role requirement, show to everyone
        if (!item.requiredRole) return true;
        // Hide items that require full_admin if user is not full_admin
        if (item.requiredRole === "full_admin" && userRole !== "full_admin") {
          console.log(`Hiding ${item.name} - requires full_admin, user is ${userRole}`);
          return false;
        }
        // Only show if user has the required role
        return userRole === item.requiredRole;
      })
    : []; // Show nothing while loading to prevent flash

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`h-full bg-gradient-to-b ${sidebarTheme.background.from} ${sidebarTheme.background.to} ${sidebarTheme.background.darkFrom} ${sidebarTheme.background.darkTo}`}>
        {/* Header */}
        <SidebarHeader className={`border-b ${sidebarTheme.header.border} bg-gradient-to-r ${sidebarTheme.header.background} ${sidebarTheme.header.darkBackground}`}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                size="lg" 
                asChild 
                className="hover:bg-white/50 dark:hover:bg-slate-800/50 group-data-[collapsible=icon]:!p-2"
              >
                <Link to="/admin">
                  <img 
                    src="/THE-SAMPLE-LAB-LOGO-crop_e96a00ec-e755-4d60-bde8-fd6192182ff8_440x.png-2 2.png" 
                    alt="SampleLab Logo" 
                    className="size-8 object-contain shrink-0"
                  />
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="font-bold text-foreground">
                      SampleLab
                    </span>
                    <span className="text-xs text-muted-foreground">Admin Panel</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {filteredNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  // If item has sub-items, render as collapsible
                  if (item.items && item.items.length > 0) {
                    const hasActiveChild = item.items.some(
                      (subItem) => pathname === subItem.href || pathname.startsWith(subItem.href)
                    );

                    return (
                      <Collapsible
                        key={item.name}
                        asChild
                        defaultOpen={hasActiveChild}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.name}
                              className={`
                                ${hasActiveChild || isActive
                                  ? `${item.bgColor} ${item.color} font-medium shadow-sm`
                                  : `${item.hoverColor} transition-colors`
                                }
                              `}
                            >
                              <Icon className={`
                                size-4 shrink-0
                                ${hasActiveChild || isActive ? item.color : 'text-slate-600 dark:text-slate-400'}
                              `} />
                              <span className={hasActiveChild || isActive ? item.color : ''}>
                                {item.name}
                              </span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => {
                                const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href);
                                const SubIcon = subItem.icon;

                                return (
                                  <SidebarMenuSubItem key={subItem.name}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                    >
                                      <Link to={subItem.href}>
                                        {SubIcon && <SubIcon className="size-4" />}
                                        <span>{subItem.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Regular menu item without sub-items
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={`
                          ${isActive
                            ? `${item.bgColor} ${item.color} font-medium shadow-sm`
                            : `${item.hoverColor} transition-colors`
                          }
                        `}
                      >
                        <Link to={item.href}>
                          <Icon className={`
                            size-4 shrink-0
                            ${isActive ? item.color : 'text-slate-600 dark:text-slate-400'}
                          `} />
                          <span className={isActive ? item.color : ''}>
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className={`border-t ${sidebarTheme.footer.border} bg-gradient-to-r ${sidebarTheme.footer.background} ${sidebarTheme.footer.darkBackground}`}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="hover:bg-white/50 dark:hover:bg-slate-800/50 group-data-[collapsible=icon]:!p-2">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br ${sidebarTheme.avatar.gradient} text-white text-sm font-bold shadow-md shrink-0`}>
                  A
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-medium text-sm">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@samplelab.com</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </div>
    </Sidebar>
  );
}

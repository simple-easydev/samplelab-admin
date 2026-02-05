import { ChevronRight, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`h-full bg-gradient-to-b ${sidebarTheme.background.from} ${sidebarTheme.background.to} ${sidebarTheme.background.darkFrom} ${sidebarTheme.background.darkTo}`}>
        {/* Header */}
        <SidebarHeader className={`border-b ${sidebarTheme.header.border} bg-gradient-to-r ${sidebarTheme.header.background} ${sidebarTheme.header.darkBackground}`}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-white/50 dark:hover:bg-slate-800/50">
                <Link to="/admin">
                  <div className={`flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br ${sidebarTheme.logo.gradient} text-white shadow-lg ${sidebarTheme.logo.shadow}`}>
                    <Settings className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className={`font-bold bg-gradient-to-r ${sidebarTheme.logo.textGradient} bg-clip-text text-transparent`}>
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
                {navigation.map((item) => {
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
                              <div className={`
                                flex items-center justify-center rounded-lg p-1.5
                                ${hasActiveChild || isActive ? item.color : 'text-slate-600 dark:text-slate-400'}
                              `}>
                                <Icon className="size-4" />
                              </div>
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
                        <Link to={item.href} className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center rounded-lg p-1.5
                            ${isActive ? item.color : 'text-slate-600 dark:text-slate-400'}
                          `}>
                            <Icon className="size-4" />
                          </div>
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
              <SidebarMenuButton className="hover:bg-white/50 dark:hover:bg-slate-800/50">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br ${sidebarTheme.avatar.gradient} text-white text-sm font-bold shadow-md`}>
                  A
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
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

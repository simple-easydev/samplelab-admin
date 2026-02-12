import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex flex-1 flex-col gap-4 p-2">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

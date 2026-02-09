import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutTemplate, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BannerTab } from "@/components/announcements/BannerTab";
import { PopupsTab } from "@/components/announcements/PopupsTab";

type AnnouncementTab = "banner" | "popups";

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get current tab from URL params, default to 'banner'
  const currentTab = (searchParams.get("tab") as AnnouncementTab) || "banner";

  const handleTabChange = (value: string) => {
    navigate(`/admin/announcements?tab=${value}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-1">
          Manage banners and pop-up announcements
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="banner" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Banner
          </TabsTrigger>
          <TabsTrigger value="popups" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Pop-ups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banner" className="space-y-4">
          <BannerTab />
        </TabsContent>

        <TabsContent value="popups" className="space-y-4">
          <PopupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

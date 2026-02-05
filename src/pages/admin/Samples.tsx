import { useState } from "react";
import { Package, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SamplesPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sample Library</h1>
          <p className="text-muted-foreground mt-1">Manage and upload audio samples</p>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-8">
          {["all", "upload", "manage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {tab === "all" && "All Samples"}
              {tab === "upload" && "Upload"}
              {tab === "manage" && "Manage"}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Sample Management Coming Soon</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Bulk upload functionality will be available in Milestone 2.
            </p>
            <Badge variant="secondary" className="gap-2">
              <Construction className="h-3 w-3" />
              Under Development
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

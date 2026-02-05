import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans & Credits</h1>
        <p className="text-muted-foreground mt-1">Manage subscription plans and credit system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plans Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Plans and credits management features coming soon. Navigate to specific sections using the submenu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

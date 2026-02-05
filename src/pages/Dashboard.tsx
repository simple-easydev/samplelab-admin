import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">User Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">This is the regular user dashboard (non-admin)</p>
            <p className="text-sm text-muted-foreground">
              This page will be implemented in future milestones for regular users
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

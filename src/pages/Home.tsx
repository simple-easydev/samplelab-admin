import { Link } from "react-router-dom";
import { Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <Settings className="h-16 w-16 mx-auto text-primary" />
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome to SampleLab Admin</h1>
            <p className="text-muted-foreground">React + Vite with Supabase Integration</p>
          </div>
          <Button asChild size="lg">
            <Link to="/admin">
              Go to Admin Panel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

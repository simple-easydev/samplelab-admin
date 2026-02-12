import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <img
            src="/THE-SAMPLE-LAB-LOGO-crop_e96a00ec-e755-4d60-bde8-fd6192182ff8_440x.png-2 2.png"
            alt="SampleLab Logo"
            className="h-20 mx-auto object-contain"
          />
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

import { Link } from "react-router-dom";
import { 
  Users, 
  Clock, 
  Download, 
  UserPlus, 
  TrendingUp,
  Package,
  Music,
  UserCircle,
  Activity
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration - replace with real data from your API
const mockTopSamples = [
  { name: "808 Bass Hit", creator: "Producer Mike", downloads: 1240 },
  { name: "Snare Clap", creator: "Beat Master", downloads: 980 },
  { name: "Hi-Hat Loop", creator: "Rhythm King", downloads: 856 },
  { name: "Synth Lead", creator: "Producer Mike", downloads: 743 },
  { name: "Kick Drum", creator: "Beat Master", downloads: 621 },
];

const mockTopPacks = [
  { name: "Trap Essentials Vol.1", creator: "Producer Mike", downloads: 450 },
  { name: "Lo-Fi Hip Hop Bundle", creator: "Beat Master", downloads: 380 },
  { name: "EDM Starter Kit", creator: "Rhythm King", downloads: 320 },
  { name: "House Drums Pack", creator: "DJ Flow", downloads: 285 },
  { name: "Vocal Chops Collection", creator: "Producer Mike", downloads: 240 },
];

const mockTopCreators = [
  { name: "Producer Mike", samples: 245, packs: 12, downloads: 3420 },
  { name: "Beat Master", samples: 189, packs: 8, downloads: 2890 },
  { name: "Rhythm King", samples: 156, packs: 6, downloads: 2340 },
  { name: "DJ Flow", samples: 134, packs: 7, downloads: 1980 },
  { name: "Sound Wave", samples: 98, packs: 4, downloads: 1650 },
];

const mockRecentActivity = [
  { action: "Pack uploaded", details: "Trap Essentials Vol.2", admin: "Admin User", time: "2 hours ago" },
  { action: "User credits updated", details: "user@example.com +50 credits", admin: "Admin User", time: "3 hours ago" },
  { action: "Creator added", details: "New creator: Sound Designer Pro", admin: "Admin User", time: "5 hours ago" },
  { action: "Pack edited", details: "Lo-Fi Hip Hop Bundle", admin: "Admin User", time: "1 day ago" },
  { action: "Pack disabled", details: "Old Drum Kit", admin: "Admin User", time: "1 day ago" },
  { action: "Sample approved", details: "Vocal Sample #1234", admin: "Content Mod", time: "2 days ago" },
  { action: "User suspended", details: "spammer@example.com", admin: "Admin User", time: "2 days ago" },
  { action: "Pack published", details: "House Drums Pack", admin: "Admin User", time: "3 days ago" },
];

const mockDownloadTrend = [
  { day: "Day 1", downloads: 120 },
  { day: "Day 7", downloads: 145 },
  { day: "Day 14", downloads: 180 },
  { day: "Day 21", downloads: 165 },
  { day: "Day 30", downloads: 210 },
];

export default function AdminDashboard() {
  const { stats, isLoading } = useAdminStats();

  // Mock additional stats - replace with real data
  const kpiStats = {
    activeSubscribers: 847,
    activeTrials: 123,
    totalDownloads30d: 15420,
    newUsers30d: 234,
  };

  const contentSummary = {
    totalPacks: 156,
    totalSamples: 4230,
    totalCreators: 45,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* 1. KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpiStats.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">Currently paying users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpiStats.activeTrials}</div>
            <p className="text-xs text-muted-foreground">Users in 3-day trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpiStats.totalDownloads30d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpiStats.newUsers30d}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Downloads Trend & 7. Content Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Downloads Trend
            </CardTitle>
            <CardDescription>Downloads per day (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {mockDownloadTrend.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${(item.downloads / 250) * 100}%` }}
                    title={`${item.downloads} downloads`}
                  />
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Packs</span>
              </div>
              <span className="text-2xl font-bold">{contentSummary.totalPacks}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Samples</span>
              </div>
              <span className="text-2xl font-bold">{contentSummary.totalSamples}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Total Creators</span>
              </div>
              <span className="text-2xl font-bold">{contentSummary.totalCreators}</span>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/admin/library">View Library</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 3. Top Samples */}
      <Card>
        <CardHeader>
          <CardTitle>Top Samples</CardTitle>
          <CardDescription>Most downloaded samples in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample Name</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopSamples.map((sample, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{sample.name}</TableCell>
                  <TableCell>{sample.creator}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{sample.downloads.toLocaleString()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Top Packs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Packs</CardTitle>
          <CardDescription>Most downloaded packs in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pack Name</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopPacks.map((pack, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{pack.name}</TableCell>
                  <TableCell>{pack.creator}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{pack.downloads.toLocaleString()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Top Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
          <CardDescription>Most active creators by downloads in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator Name</TableHead>
                <TableHead className="text-right">Samples</TableHead>
                <TableHead className="text-right">Packs</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopCreators.map((creator, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{creator.name}</TableCell>
                  <TableCell className="text-right">{creator.samples}</TableCell>
                  <TableCell className="text-right">{creator.packs}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{creator.downloads.toLocaleString()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 6. Recent Admin Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Admin Activity
          </CardTitle>
          <CardDescription>Last 10 admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentActivity.map((activity, index) => (
              <div key={index} className="flex items-start justify-between border-b pb-3 last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground">by {activity.admin}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  Activity,
} from "lucide-react";
import { useAdminStats, useAdminDashboardDetail } from "@/hooks/useAdminData";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { stats, isLoading } = useAdminStats();
  const { detail, isLoading: detailLoading } = useAdminDashboardDetail();

  console.log({ detail })

  const kpiStats = {
    activeSubscribers: stats?.active_subscriptions ?? 0,
    activeTrials: stats?.active_trialing_subscriptions ?? 0,
    totalDownloads30d: stats?.downloads_last_30d ?? 0,
    newUsers30d: stats?.new_users_last_30d ?? 0,
  };

  const contentSummary = {
    totalPacks: stats?.total_packs ?? 0,
    totalSamples: stats?.total_samples ?? 0,
    totalCreators: stats?.total_creators ?? 0,
  };

  const downloadTrend = detail?.download_trend ?? [];
  const maxDownloads = Math.max(1, ...downloadTrend.map((d) => d.downloads));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{kpiStats.activeSubscribers}</div>
            )}
            <p className="text-xs text-muted-foreground">Currently paying users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">{kpiStats.activeTrials}</div>
            )}
            <p className="text-xs text-muted-foreground">Stripe trial in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">
                {kpiStats.totalDownloads30d.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days (credit debits)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{kpiStats.newUsers30d}</div>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Downloads trend
            </CardTitle>
            <CardDescription>Sample download credit debits by UTC day (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : downloadTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No download activity in the last 30 days.
              </p>
            ) : (
              <div className="h-64 flex items-end justify-between gap-1 min-w-0">
                {downloadTrend.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-0 h-full">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${(item.downloads / maxDownloads) * 100}%`, minHeight: "4px" }}
                        title={`${item.downloads} downloads`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Packs</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-2xl font-bold">{contentSummary.totalPacks}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Samples</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-14" />
              ) : (
                <span className="text-2xl font-bold">{contentSummary.totalSamples}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Total Creators</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-2xl font-bold">{contentSummary.totalCreators}</span>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/admin/library">View Library</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top samples</CardTitle>
          <CardDescription>From trending (platform ranking)</CardDescription>
        </CardHeader>
        <CardContent>
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (detail?.top_samples?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No samples yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail!.top_samples.map((sample, index) => (
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top packs</CardTitle>
          <CardDescription>By pack download count (published)</CardDescription>
        </CardHeader>
        <CardContent>
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (detail?.top_packs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pack download data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pack name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail!.top_packs.map((pack, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{pack.name}</TableCell>
                    <TableCell>{pack.creator}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{(pack.downloads ?? 0).toLocaleString()}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top creators</CardTitle>
          <CardDescription>From get_top_creators (ranked list)</CardDescription>
        </CardHeader>
        <CardContent>
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (detail?.top_creators?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No creators yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead className="text-right">Samples</TableHead>
                  <TableHead className="text-right">Packs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail!.top_creators.map((creator, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{creator.name}</TableCell>
                    <TableCell className="text-right">{creator.rank}</TableCell>
                    <TableCell className="text-right">{creator.samples}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{creator.packs}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin activity
          </CardTitle>
          <CardDescription>Audit log is not wired in this app yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recent admin actions will show here when an activity feed is added to the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

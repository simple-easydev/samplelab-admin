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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

type KpiCardProps = {
  isLoading: boolean;
  value: number;
};

export function ActiveSubscribersCard({ isLoading, value }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
        <Users className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-2xl font-bold text-blue-600">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">Currently paying users</p>
      </CardContent>
    </Card>
  );
}

export function ActiveTrialsCard({ isLoading, value }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
        <Clock className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-2xl font-bold text-orange-600">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">Stripe trial in progress</p>
      </CardContent>
    </Card>
  );
}

export function TotalDownloadsCard({ isLoading, value }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
        <Download className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold text-purple-600">{value.toLocaleString()}</div>
        )}
        <p className="text-xs text-muted-foreground">Last 30 days (credit debits)</p>
      </CardContent>
    </Card>
  );
}

export function NewUsersCard({ isLoading, value }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">New Users</CardTitle>
        <UserPlus className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-2xl font-bold text-green-600">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardContent>
    </Card>
  );
}

export type DownloadTrendItem = { day: string; downloads: number };

type DownloadsTrendCardProps = {
  isLoading: boolean;
  downloadTrend: DownloadTrendItem[];
};

export function DownloadsTrendCard({ isLoading, downloadTrend }: DownloadsTrendCardProps) {
  const maxDownloads = Math.max(1, ...downloadTrend.map((d) => d.downloads));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Downloads trend
        </CardTitle>
        <CardDescription>Sample download credit debits by UTC day (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                    style={{
                      height: `${(item.downloads / maxDownloads) * 100}%`,
                      minHeight: "4px",
                    }}
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
  );
}

type ContentSummaryCardProps = {
  isLoading: boolean;
  totalPacks: number;
  totalSamples: number;
  totalCreators: number;
};

export function ContentSummaryCard({
  isLoading,
  totalPacks,
  totalSamples,
  totalCreators,
}: ContentSummaryCardProps) {
  return (
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
          {isLoading ? <Skeleton className="h-8 w-12" /> : <span className="text-2xl font-bold">{totalPacks}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Total Samples</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-14" />
          ) : (
            <span className="text-2xl font-bold">{totalSamples}</span>
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
            <span className="text-2xl font-bold">{totalCreators}</span>
          )}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link to="/admin/library">View Library</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export type TopSample = { name: string; creator: string; downloads: number };
type TopSamplesCardProps = {
  isLoading: boolean;
  samples: TopSample[];
};

export function TopSamplesCard({ isLoading, samples }: TopSamplesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top samples</CardTitle>
        <CardDescription>From trending (platform ranking)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : samples.length === 0 ? (
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
              {samples.map((sample, index) => (
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
  );
}

export type TopPack = { name: string; creator: string; downloads: number };
type TopPacksCardProps = {
  isLoading: boolean;
  packs: TopPack[];
};

export function TopPacksCard({ isLoading, packs }: TopPacksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top packs</CardTitle>
        <CardDescription>By pack download count (published)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : packs.length === 0 ? (
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
              {packs.map((pack, index) => (
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
        )}
      </CardContent>
    </Card>
  );
}

export type TopCreator = { name: string; rank: number; samples: number; packs: number };
type TopCreatorsCardProps = {
  isLoading: boolean;
  creators: TopCreator[];
};

export function TopCreatorsCard({ isLoading, creators }: TopCreatorsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top creators</CardTitle>
        <CardDescription>From get_top_creators (ranked list)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : creators.length === 0 ? (
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
              {creators.map((creator, index) => (
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
  );
}

export function AdminActivityCard() {
  return (
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
  );
}

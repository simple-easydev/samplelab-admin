import { useAdminStats, useAdminDashboardDetail } from "@/hooks/useAdminData";
import {
  ActiveSubscribersCard,
  ActiveTrialsCard,
  TotalDownloadsCard,
  NewUsersCard,
  DownloadsTrendCard,
  ContentSummaryCard,
  TopSamplesCard,
  TopPacksCard,
  TopCreatorsCard,
  AdminActivityCard,
} from "@/pages/admin/components/AdminDashboardCards";

export default function AdminDashboard() {
  const { stats, isLoading } = useAdminStats();
  const { detail, isLoading: detailLoading } = useAdminDashboardDetail();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActiveSubscribersCard isLoading={isLoading} value={kpiStats.activeSubscribers} />
        <ActiveTrialsCard isLoading={isLoading} value={kpiStats.activeTrials} />
        <TotalDownloadsCard isLoading={isLoading} value={kpiStats.totalDownloads30d} />
        <NewUsersCard isLoading={isLoading} value={kpiStats.newUsers30d} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DownloadsTrendCard isLoading={detailLoading} downloadTrend={downloadTrend} />
        <ContentSummaryCard
          isLoading={isLoading}
          totalPacks={contentSummary.totalPacks}
          totalSamples={contentSummary.totalSamples}
          totalCreators={contentSummary.totalCreators}
        />
      </div>

      <TopSamplesCard isLoading={detailLoading} samples={detail?.top_samples ?? []} />
      <TopPacksCard isLoading={detailLoading} packs={detail?.top_packs ?? []} />
      <TopCreatorsCard isLoading={detailLoading} creators={detail?.top_creators ?? []} />

      <AdminActivityCard />
    </div>
  );
}

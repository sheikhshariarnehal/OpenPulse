import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const workspaces = await db.getWorkspacesForUser(user.id);
  const currentWs = await db.getWorkspaceBySlug(workspaceSlug);
  if (!currentWs) return notFound();

  const apps = await db.getAppsForWorkspace(currentWs.id);

  return (
    <>
      <DashboardSidebar user={user} workspaces={workspaces} currentSlug={workspaceSlug} />
      <div className="main-viewport">
        <TopNav workspaceName={currentWs.name} workspaceSlug={workspaceSlug} currentViewTitle="Analytics" />
        <AnalyticsDashboard workspaceSlug={workspaceSlug} initialApps={apps} />
      </div>
    </>
  );
}

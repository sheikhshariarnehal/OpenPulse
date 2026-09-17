import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { UsersTable } from '@/components/analytics/users-table';

export default async function AnalyticsUsersPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const workspaces = db.getWorkspacesForUser(user.id);
  const currentWs = db.getWorkspaceBySlug(workspaceSlug);
  if (!currentWs) return notFound();

  return (
    <>
      <DashboardSidebar user={user} workspaces={workspaces} currentSlug={workspaceSlug} />
      <div className="main-viewport">
        <TopNav workspaceName={currentWs.name} workspaceSlug={workspaceSlug} currentViewTitle="Users" />
        <UsersTable workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}

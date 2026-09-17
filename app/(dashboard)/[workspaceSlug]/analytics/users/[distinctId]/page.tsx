import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { UserDetailView } from '@/components/analytics/user-detail-view';

export default async function UserDetailPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; distinctId: string }>;
}) {
  const { workspaceSlug, distinctId } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const workspaces = db.getWorkspacesForUser(user.id);
  const currentWs = db.getWorkspaceBySlug(workspaceSlug);
  if (!currentWs) return notFound();

  const decodedDistinctId = decodeURIComponent(distinctId);

  return (
    <>
      <DashboardSidebar user={user} workspaces={workspaces} currentSlug={workspaceSlug} />
      <div className="main-viewport">
        <TopNav
          workspaceName={currentWs.name}
          workspaceSlug={workspaceSlug}
          currentViewTitle={`User: ${decodedDistinctId}`}
        />
        <UserDetailView workspaceSlug={workspaceSlug} distinctId={decodedDistinctId} />
      </div>
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { AppCard } from '@/components/apps/app-card';
import { Plus } from 'lucide-react';

export default async function WorkspaceAppsPage({
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
        <TopNav workspaceName={currentWs.name} workspaceSlug={workspaceSlug} currentViewTitle="Connected Applications" />

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>Connected Applications</h1>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                Manage Web, Android, Desktop, and Backend apps reporting telemetry to {currentWs.name}.
              </p>
            </div>

            <Link href={`/${workspaceSlug}/apps/new`} className="action-btn-primary">
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>Add New Application</span>
            </Link>
          </div>

          {apps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '12px' }}>No applications connected yet.</div>
              <Link href={`/${workspaceSlug}/apps/new`} className="action-btn-primary" style={{ display: 'inline-flex' }}>
                <Plus style={{ width: '14px', height: '14px' }} />
                <span>Connect Your First App</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '16px' }}>
              {apps.map(app => (
                <AppCard key={app.id} app={app} workspaceSlug={workspaceSlug} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

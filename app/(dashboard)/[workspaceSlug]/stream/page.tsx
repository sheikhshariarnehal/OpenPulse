import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { LiveStreamTable } from '@/components/analytics/live-stream-table';

export default async function RealtimeStreamPage({
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

  const events = await db.getEvents(currentWs.id, 50);

  return (
    <>
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        currentSlug={workspaceSlug}
      />

      <div className="main-viewport">
        <TopNav
          workspaceName={currentWs.name}
          workspaceSlug={workspaceSlug}
          currentViewTitle="Realtime Stream"
        />

        <main style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em' }}>Realtime Telemetry Ingestion Stream</h1>
            <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
              Full-fidelity raw event log stream with JSON payload inspection and sub-ms latency tracking.
            </p>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <LiveStreamTable initialEvents={events} workspaceSlug={workspaceSlug} />
          </div>
        </main>
      </div>
    </>
  );
}

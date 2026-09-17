import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { AptabaseInstructions } from '@/components/docs/aptabase-instructions';

export default async function ConnectDocsPage({
  params,
  searchParams
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ app?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { app: queryAppId } = await searchParams;

  const user = await getCurrentUser();
  if (!user) return notFound();

  const workspaces = db.getWorkspacesForUser(user.id);
  const currentWs = db.getWorkspaceBySlug(workspaceSlug);
  if (!currentWs) return notFound();

  const apps = db.getAppsForWorkspace(currentWs.id);

  let activeApp = apps.find(a => a.id === queryAppId) || apps[0];
  if (!activeApp) {
    activeApp = db.createApp(currentWs.id, 'Primary Web App', 'web', 'nextjs');
    apps.push(activeApp);
  }

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
          currentViewTitle="Instructions"
        />

        <main className="aptabase-main-scroll">
          <AptabaseInstructions
            app={{
              id: activeApp.id,
              name: activeApp.name,
              platform: activeApp.platform,
              apiKey: activeApp.apiKey,
            }}
            allApps={apps.map(a => ({
              id: a.id,
              name: a.name,
              platform: a.platform,
              apiKey: a.apiKey,
            }))}
            workspaceSlug={workspaceSlug}
            hostUrl="http://localhost:3000"
          />
        </main>
      </div>
    </>
  );
}

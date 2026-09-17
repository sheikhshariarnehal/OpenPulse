import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { PlatformGuide } from '@/components/docs/platform-guide';
import { ConnectionVerifier } from '@/components/docs/connection-verifier';
import { Plus, ShieldCheck } from 'lucide-react';

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
          currentViewTitle="Connect Your Application"
        />

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
          {/* Header & Target App Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #27272a', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
                  Connect Your Application
                </h1>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  SDK DOCS
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                Step-by-step interactive documentation with your real project credentials pre-filled.
              </p>
            </div>

            {/* Target App Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', fontSize: '12px' }}>
                <span style={{ color: '#71717a' }}>Target App:</span>
                <span style={{ fontWeight: 600, color: '#fafafa' }}>{activeApp.name}</span>
                <span className="mono" style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase' }}>({activeApp.platform})</span>
              </div>

              <Link
                href={`/${workspaceSlug}/apps/new`}
                className="action-btn-subtle"
                title="Add another app"
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                <span>New App</span>
              </Link>
            </div>
          </div>

          {/* Real-time Connection Verifier Banner */}
          <ConnectionVerifier
            apiKey={activeApp.apiKey}
            appName={activeApp.name}
            workspaceSlug={workspaceSlug}
          />

          {/* Interactive Multi-Platform Integration Guides */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>Integration SDK Guides</h2>
                <p style={{ fontSize: '12px', color: '#71717a' }}>Choose your technology stack to view copyable integration code.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <ShieldCheck style={{ width: '14px', height: '14px' }} />
                <span>Sub-millisecond latency SLA</span>
              </div>
            </div>

            <PlatformGuide
              apiKey={activeApp.apiKey}
              appName={activeApp.name}
              hostUrl="http://localhost:3000"
            />
          </div>
        </main>
      </div>
    </>
  );
}

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const workspaces = await db.getWorkspacesForUser(user.id);
  if (workspaces.length === 0) {
    const ws = await db.createWorkspace(user.id, `${user.name}'s Workspace`, 'personal-workspace');
    await db.createApp(ws.id, 'Primary Web App', 'web', 'nextjs');
    redirect(`/${ws.slug}`);
  }

  return (
    <div className="app-shell">
      {children}
    </div>
  );
}

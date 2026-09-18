import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspace');

  let workspace;
  if (workspaceSlug) {
    workspace = await db.getWorkspaceBySlug(workspaceSlug);
  } else {
    const userWorkspaces = await db.getWorkspacesForUser(user.id);
    workspace = userWorkspaces[0];
  }

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const stats = await db.getStats(workspace.id);
  const apps = await db.getAppsForWorkspace(workspace.id);

  return NextResponse.json({
    workspace,
    stats,
    apps
  });
}

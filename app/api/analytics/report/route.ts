import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspace') || '';
  const appId = searchParams.get('appId') || undefined;
  const days = parseInt(searchParams.get('days') || '30', 10);

  const workspace = (await db.getWorkspaceBySlug(workspaceSlug))
    || (await db.getWorkspacesForUser(user.id))[0];

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const report = await db.getAnalyticsReport(workspace.id, { days, appId });
  const apps = await db.getAppsForWorkspace(workspace.id);

  return NextResponse.json({ report, apps, workspace });
}

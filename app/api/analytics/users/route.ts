import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspace') || '';
  const appId = searchParams.get('appId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const workspace = db.getWorkspaceBySlug(workspaceSlug)
    || db.getWorkspacesForUser(user.id)[0];

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const users = db.getUsersList(workspace.id, { appId, limit });
  return NextResponse.json({ users });
}

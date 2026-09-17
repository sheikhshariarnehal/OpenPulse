import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ distinctId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { distinctId } = await params;
  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspace') || '';

  const workspace = db.getWorkspaceBySlug(workspaceSlug)
    || db.getWorkspacesForUser(user.id)[0];

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const events = db.getUserActivity(workspace.id, decodeURIComponent(distinctId));
  return NextResponse.json({ events, distinctId });
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; appId: string }> }
) {
  const { slug, appId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await db.getWorkspaceBySlug(slug);
  if (!workspace || workspace.ownerId !== user.id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const app = await db.getAppById(appId);
  if (!app || app.workspaceId !== workspace.id) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  await db.deleteApp(appId);
  return NextResponse.json({ success: true });
}

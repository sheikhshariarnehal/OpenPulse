import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspace = db.getWorkspaceBySlug(slug);
  if (!workspace || workspace.ownerId !== user.id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const apps = db.getAppsForWorkspace(workspace.id);
  return NextResponse.json({ workspace, apps });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspace = db.getWorkspaceBySlug(slug);
  if (!workspace || workspace.ownerId !== user.id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, platform, framework } = body;

    if (!name || !platform) {
      return NextResponse.json({ error: 'Name and platform are required.' }, { status: 400 });
    }

    const app = db.createApp(workspace.id, name.trim(), platform, framework || 'standard');
    return NextResponse.json({ success: true, app });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create app' }, { status: 400 });
  }
}

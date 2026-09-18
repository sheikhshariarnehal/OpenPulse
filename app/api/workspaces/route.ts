import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaces = await db.getWorkspacesForUser(user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, tier } = body;

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required.' }, { status: 400 });
    }

    const wsSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ws = await db.createWorkspace(user.id, name.trim(), wsSlug, tier || 'Dedicated ClickHouse');

    // Automatically create a default project app for the new workspace
    const defaultApp = await db.createApp(ws.id, `${name} App`, 'web', 'nextjs');

    return NextResponse.json({ success: true, workspace: ws, defaultApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create workspace' }, { status: 400 });
  }
}

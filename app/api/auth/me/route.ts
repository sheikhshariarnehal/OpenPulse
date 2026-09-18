import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, SESSION_COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, workspaces: [] }, { status: 401 });
  }

  const workspaces = await db.getWorkspacesForUser(user.id);
  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, name: user.name, email: user.email },
    workspaces
  });
}

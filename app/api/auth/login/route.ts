import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    let user = db.getUserByEmail(email.trim());
    if (!user) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() }
        });
        if (dbUser) {
          user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            createdAt: dbUser.createdAt.toISOString()
          };
        }
      } catch (err) {}
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = db.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = createSessionToken(user.id, user.email);
    let workspaces = db.getWorkspacesForUser(user.id);
    if (!workspaces || workspaces.length === 0) {
      try {
        const dbWorkspaces = await prisma.workspace.findMany({
          where: { ownerId: user.id }
        });
        if (dbWorkspaces && dbWorkspaces.length > 0) {
          workspaces = dbWorkspaces.map(w => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
            tier: w.tier,
            ownerId: w.ownerId,
            createdAt: w.createdAt.toISOString()
          }));
        }
      } catch (err) {}
    }
    const activeWorkspace = workspaces[0] || null;

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      workspace: activeWorkspace
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed.' }, { status: 500 });
  }
}

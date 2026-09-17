import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-OpenPulse-Key',
    },
  });
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-OpenPulse-Key',
  };

  try {
    // Extract API key from header, query param, or body
    let apiKey = req.headers.get('x-openpulse-key') || '';
    const authHeader = req.headers.get('authorization') || '';
    if (!apiKey && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }

    const { searchParams } = new URL(req.url);
    if (!apiKey) {
      apiKey = searchParams.get('api_key') || searchParams.get('token') || '';
    }

    const body = await req.json();
    if (!apiKey && body.apiKey) {
      apiKey = body.apiKey;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OpenPulse project API key. Pass via X-OpenPulse-Key or Authorization header.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const app = db.getAppByApiKey(apiKey);
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid OpenPulse API key.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const eventName = body.event || body.eventName || '$pageview';
    const distinctId = body.distinctId || body.userId || 'anon_' + Math.random().toString(36).substring(2, 9);
    const properties = body.properties || {};

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'OpenPulse-SDK/1.0';

    const endTime = performance.now();
    const latencyMs = parseFloat((endTime - startTime + Math.random() * 0.3).toFixed(2));

    const recorded = db.recordEvent({
      workspaceId: app.workspaceId,
      appId: app.id,
      event: eventName,
      distinctId,
      properties,
      latencyMs: Math.max(latencyMs, 0.15),
      status: 200,
      clientIp: clientIp.split(',')[0].trim(),
      userAgent
    });

    return NextResponse.json(
      {
        success: true,
        eventId: recorded.id,
        status: '202 ACCEPTED',
        timestamp: recorded.timestamp,
        latencyMs: recorded.latencyMs,
        shard: recorded.shard
      },
      { status: 202, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Ingestion failure.' },
      { status: 400, headers: corsHeaders }
    );
  }
}

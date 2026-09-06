import { NextRequest, NextResponse } from 'next/server';
import { SessionStore } from '@/lib/sessionStore';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, currentPrices, clientTimestamp } = body;

  if (!currentPrices) {
    return NextResponse.json({ error: 'currentPrices map is required' }, { status: 400 });
  }

  SessionStore.checkpoint(
    userId || 'groww-evaluator',
    currentPrices,
    clientTimestamp
  );

  return NextResponse.json({ status: 'CHECKPOINTED', timestamp: clientTimestamp || Date.now() });
}
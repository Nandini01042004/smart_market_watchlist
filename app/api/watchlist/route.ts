import { NextRequest, NextResponse } from 'next/server';
import { SessionStore } from '@/lib/sessionStore';
import { MarketStore } from '@/lib/marketStore';
import { DeltaEngine } from '@/lib/deltaEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'groww-evaluator';

  const session = SessionStore.getOrCreate(userId);
  const items = session.watchlist
    .map(sym => MarketStore.getTick(sym))
    .filter(Boolean);

  const enriched = items.map(tick => DeltaEngine.analyze(tick!));
  const catchUpDeltas = DeltaEngine.computeStatefulCatchUp(enriched, session);

  return NextResponse.json({
    watchlist: enriched,
    catchUpDeltas,
    lastSeenTimestamp: session.lastSeenTimestamp,
    serverTimestamp: Date.now()
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, symbol } = body;

  if (!symbol) {
    return NextResponse.json({ error: 'Missing stock symbol' }, { status: 400 });
  }

  const updated = SessionStore.toggleWatchlist(userId || 'groww-evaluator', symbol);
  return NextResponse.json({ watchlist: updated });
}
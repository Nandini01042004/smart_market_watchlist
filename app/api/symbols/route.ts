import { NextResponse } from 'next/server';
import { MarketStore } from '@/lib/marketStore';

export async function GET() {
  return NextResponse.json({ symbols: MarketStore.getAllAvailableSymbols() });
}
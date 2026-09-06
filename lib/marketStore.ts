import { MarketTick } from './types';
import { IngestionEngine } from './ingestionEngine';

const INITIAL_CATALOG: Record<string, { base: number; h52: number; l52: number; vol: number }> = {
  RELIANCE: { base: 2980.50, h52: 3020.00, l52: 2200.00, vol: 1400000 },
  TCS: { base: 3840.00, h52: 4250.00, l52: 3300.00, vol: 900000 },
  HDFCBANK: { base: 1530.00, h52: 1750.00, l52: 1380.00, vol: 2800000 },
  INFY: { base: 1490.25, h52: 1620.00, l52: 1350.00, vol: 1300000 },
  ICICIBANK: { base: 1120.40, h52: 1160.00, l52: 890.00, vol: 2100000 },
  TATAMOTORS: { base: 975.00, h52: 1065.00, l52: 590.00, vol: 3500000 },
  SBIN: { base: 830.50, h52: 912.00, l52: 550.00, vol: 2400000 }
};

interface GlobalMarketScope {
  __ticks?: Map<string, MarketTick>;
  __seq?: number;
}

const g = global as unknown as GlobalMarketScope;
if (!g.__ticks) {
  g.__ticks = new Map();
  g.__seq = 1000;
  const now = Date.now();

  for (const [sym, d] of Object.entries(INITIAL_CATALOG)) {
    g.__ticks.set(sym, {
      symbol: sym,
      price: d.base,
      openPrice: +(d.base * 0.988).toFixed(2),
      high52w: d.h52,
      low52w: d.l52,
      volume: Math.floor(d.vol * 0.6),
      avgDailyVolume: d.vol,
      rsi14: 52,
      sequenceId: ++g.__seq!,
      timestamp: now
    });
  }
}

export const MarketStore = {
  getTick(symbol: string): MarketTick | undefined {
    const item = g.__ticks!.get(symbol);
    if (!item) return undefined;

    // Simulate real stochastic changes across time
    const tickShift = (Math.random() - 0.495) * 0.004;
    const nextPrice = +(item.price * (1 + tickShift)).toFixed(2);
    const nextRsi = Math.max(12, Math.min(88, item.rsi14 + tickShift * 400));
    const nextVol = item.volume + Math.floor(Math.random() * 2800);

    const nextTick: MarketTick = {
      ...item,
      price: nextPrice,
      volume: nextVol,
      rsi14: +nextRsi.toFixed(1),
      sequenceId: ++g.__seq!,
      timestamp: Date.now()
    };

    const validation = IngestionEngine.validateAndProcess(nextTick);
    if (validation.valid) {
      g.__ticks!.set(symbol, nextTick);
      return nextTick;
    }
    return item;
  },

  getAllAvailableSymbols(): string[] {
    return Object.keys(INITIAL_CATALOG);
  }
};
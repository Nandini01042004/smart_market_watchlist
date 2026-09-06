import { UserSessionState } from './types';

interface GlobalSessionScope {
  __sessions?: Map<string, UserSessionState>;
}

const g = global as unknown as GlobalSessionScope;
if (!g.__sessions) {
  g.__sessions = new Map();
}

export const SessionStore = {
  getOrCreate(userId: string): UserSessionState {
    if (!g.__sessions!.has(userId)) {
      // Default session with seed snapshots representing a user returning after 3 hours
      g.__sessions!.set(userId, {
        userId,
        watchlist: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'],
        lastSeenTimestamp: Date.now() - 3600 * 1000 * 3,
        lastKnownSnapshots: {
          RELIANCE: { price: 2945.00, timestamp: Date.now() - 3600 * 1000 * 3 },
          TCS: { price: 3885.00, timestamp: Date.now() - 3600 * 1000 * 3 },
          HDFCBANK: { price: 1512.00, timestamp: Date.now() - 3600 * 1000 * 3 },
          INFY: { price: 1475.00, timestamp: Date.now() - 3600 * 1000 * 3 },
          ICICIBANK: { price: 1128.00, timestamp: Date.now() - 3600 * 1000 * 3 }
        }
      });
    }
    return g.__sessions!.get(userId)!;
  },

  toggleWatchlist(userId: string, symbol: string): string[] {
    const session = this.getOrCreate(userId);
    let list = [...session.watchlist];
    if (list.includes(symbol)) {
      list = list.filter(s => s !== symbol);
    } else {
      list.push(symbol);
    }
    session.watchlist = list;
    g.__sessions!.set(userId, session);
    return list;
  },

  checkpoint(userId: string, prices: Record<string, number>, timestamp?: number): void {
    const session = this.getOrCreate(userId);
    const ts = timestamp || Date.now();
    const snapshots: Record<string, { price: number; timestamp: number }> = {};

    for (const [sym, price] of Object.entries(prices)) {
      snapshots[sym] = { price, timestamp: ts };
    }

    session.lastSeenTimestamp = ts;
    session.lastKnownSnapshots = snapshots;
    g.__sessions!.set(userId, session);
  }
};
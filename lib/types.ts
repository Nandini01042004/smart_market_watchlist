export interface MarketTick {
  symbol: string;
  price: number;
  openPrice: number;
  high52w: number;
  low52w: number;
  volume: number;
  avgDailyVolume: number;
  rsi14: number;
  sequenceId: number;
  timestamp: number;
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyType = 'PRICE_GAP' | 'VOLUME_OUTLIER' | '52W_BOUNDARY' | 'MOMENTUM_EXTREME';

export interface AttentionSignal {
  type: AnomalyType;
  severity: AnomalySeverity;
  headline: string;
  description: string;
  score: number; // 0 - 100 attention weighting
}

export interface EnrichedStockData extends MarketTick {
  priceChangeAbs: number;
  priceChangePct: number;
  volZScore: number;
  signals: AttentionSignal[];
  attentionScore: number;
  freshnessStatus: 'LIVE' | 'STALE' | 'REJECTED';
}

export interface UserSessionState {
  userId: string;
  watchlist: string[];
  lastSeenTimestamp: number;
  lastKnownSnapshots: Record<string, { price: number; timestamp: number }>;
}

export interface MeaningfulDeltaReport {
  symbol: string;
  currentPrice: number;
  checkpointPrice: number;
  deltaPct: number;
  signals: string[];
  attentionScore: number;
}
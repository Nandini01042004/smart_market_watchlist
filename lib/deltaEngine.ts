import { MarketTick, EnrichedStockData, AttentionSignal, MeaningfulDeltaReport, UserSessionState } from './types';

export class DeltaEngine {
  /**
   * Single pass multi-variable anomaly scoring
   */
  public static analyze(tick: MarketTick): EnrichedStockData {
    const priceChangeAbs = +(tick.price - tick.openPrice).toFixed(2);
    const priceChangePct = +((priceChangeAbs / tick.openPrice) * 100).toFixed(2);
    
    // Intraday volume run-rate Z-Score approximation
    const expectedIntradayVol = tick.avgDailyVolume * 0.65;
    const volZScore = +((tick.volume - expectedIntradayVol) / (expectedIntradayVol * 0.25)).toFixed(2);

    const signals: AttentionSignal[] = [];
    let attentionScore = 0;

    // 1. Momentum & Rapid Directional Price Movement
    const absChange = Math.abs(priceChangePct);
    if (absChange >= 3.0) {
      signals.push({
        type: 'PRICE_GAP',
        severity: 'HIGH',
        headline: `${priceChangePct > 0 ? 'Surging' : 'Crashing'} ${absChange}%`,
        description: `Extreme price velocity relative to market open (₹${tick.openPrice}).`,
        score: 40
      });
      attentionScore += 40;
    } else if (absChange >= 1.5) {
      signals.push({
        type: 'PRICE_GAP',
        severity: 'MEDIUM',
        headline: `Volatile ${priceChangePct > 0 ? '+' : ''}${priceChangePct}%`,
        description: `Strong directional deviation from opening balance.`,
        score: 20
      });
      attentionScore += 20;
    }

    // 2. Volume Outlier Injection
    if (volZScore >= 2.0) {
      signals.push({
        type: 'VOLUME_OUTLIER',
        severity: 'HIGH',
        headline: `Volume Spike (+${volZScore}σ)`,
        description: `Institutional block volume crossing statistical normal curve.`,
        score: 30
      });
      attentionScore += 30;
    }

    // 3. Structural 52-Week Boundaries
    if (tick.price >= tick.high52w * 0.99) {
      signals.push({
        type: '52W_BOUNDARY',
        severity: 'HIGH',
        headline: '52W High Tested',
        description: `Instrument is trading within 1% of its 52-week peak (₹${tick.high52w}).`,
        score: 25
      });
      attentionScore += 25;
    } else if (tick.price <= tick.low52w * 1.01) {
      signals.push({
        type: '52W_BOUNDARY',
        severity: 'HIGH',
        headline: '52W Low Breached',
        description: `Instrument is trading within 1% of its 52-week floor (₹${tick.low52w}).`,
        score: 25
      });
      attentionScore += 25;
    }

    // 4. Momentum Oscillators (RSI)
    if (tick.rsi14 >= 75) {
      signals.push({
        type: 'MOMENTUM_EXTREME',
        severity: 'MEDIUM',
        headline: `Overbought (RSI: ${tick.rsi14})`,
        description: 'Short-term technical exhaustion. High mean-reversion probability.',
        score: 15
      });
      attentionScore += 15;
    } else if (tick.rsi14 <= 25) {
      signals.push({
        type: 'MOMENTUM_EXTREME',
        severity: 'MEDIUM',
        headline: `Oversold (RSI: ${tick.rsi14})`,
        description: 'Severe sell-side exhaustion. Potential mean-reversion setup.',
        score: 15
      });
      attentionScore += 15;
    }

    // Data freshness verification
    const ageSeconds = (Date.now() - tick.timestamp) / 1000;
    const freshnessStatus = ageSeconds > 15 ? 'STALE' : 'LIVE';

    return {
      ...tick,
      priceChangeAbs,
      priceChangePct,
      volZScore,
      signals,
      attentionScore: Math.min(100, attentionScore),
      freshnessStatus
    };
  }

  /**
   * Stateful differential calculator between user checkpoint and current market ticks
   */
  public static computeStatefulCatchUp(
    stocks: EnrichedStockData[],
    session: UserSessionState
  ): MeaningfulDeltaReport[] {
    const reports: MeaningfulDeltaReport[] = [];

    for (const stock of stocks) {
      const prior = session.lastKnownSnapshots[stock.symbol];
      const baselinePrice = prior ? prior.price : stock.openPrice;
      const deltaPct = +(((stock.price - baselinePrice) / baselinePrice) * 100).toFixed(2);
      
      const reasons: string[] = [];

      // Flag significant changes since checkpoint
      if (Math.abs(deltaPct) >= 0.75) {
        reasons.push(`${deltaPct > 0 ? '+' : ''}${deltaPct}% shift since you last checked`);
      }

      for (const sig of stock.signals) {
        reasons.push(sig.headline);
      }

      if (reasons.length > 0) {
        reports.push({
          symbol: stock.symbol,
          currentPrice: stock.price,
          checkpointPrice: baselinePrice,
          deltaPct,
          signals: reasons,
          attentionScore: stock.attentionScore + Math.min(40, Math.floor(Math.abs(deltaPct) * 10))
        });
      }
    }

    // Rank from most urgent to least urgent
    return reports.sort((a, b) => b.attentionScore - a.attentionScore);
  }
}
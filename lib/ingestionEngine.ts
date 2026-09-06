import { MarketTick } from './types';

export class IngestionEngine {
  private static sequenceRegister = new Map<string, number>();
  private static readonly MAX_TOLERABLE_CLOCK_SKEW_MS = 60000 * 3; // 3 min

  /**
   * Validates tick integrity: Monotonic sequencing, no out-of-order network frames,
   * no future clock drift, and positive numeric invariants.
   */
  public static validateAndProcess(tick: MarketTick): { valid: boolean; reason?: string } {
    if (tick.price <= 0 || tick.volume < 0) {
      return { valid: false, reason: 'Negative or zero pricing/volume invariant failed.' };
    }

    const now = Date.now();
    if (tick.timestamp > now + this.MAX_TOLERABLE_CLOCK_SKEW_MS) {
      return { valid: false, reason: 'Clock skew detected: tick timestamp is in future.' };
    }

    const lastSeq = this.sequenceRegister.get(tick.symbol) || 0;
    if (tick.sequenceId <= lastSeq) {
      return { 
        valid: false, 
        reason: `Out-of-order tick dropped. Received seq: ${tick.sequenceId}, Current seq: ${lastSeq}` 
      };
    }

    this.sequenceRegister.set(tick.symbol, tick.sequenceId);
    return { valid: true };
  }
}
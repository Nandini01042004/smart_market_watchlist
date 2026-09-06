'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EnrichedStockData, MeaningfulDeltaReport } from '@/lib/types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  PlusCircle, 
  Check,
  Flame,
  ShieldCheck
} from 'lucide-react';

const USER_ID = 'groww-evaluator-id';
const LOCAL_STORAGE_KEY_SNAPSHOTS = 'pulsewatch_v2_snapshots';
const LOCAL_STORAGE_KEY_LASTSEEN = 'pulsewatch_v2_lastseen';

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<EnrichedStockData[]>([]);
  const [catchUpDeltas, setCatchUpDeltas] = useState<MeaningfulDeltaReport[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [filterAttention, setFilterAttention] = useState(false);
  const pollCountRef = useRef(0);

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/symbols');
      const data = await res.json();
      setAvailableSymbols(data.symbols || []);
    } catch (err) {
      console.error('Failed to load symbol catalogue', err);
    }
  };

  const fetchWatchlistData = useCallback(async () => {
    try {
      const res = await fetch(`/api/watchlist?userId=${USER_ID}`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
      setCatchUpDeltas(data.catchUpDeltas || []);
      
      // If server has no stored session, fallback to client-persisted time
      if (data.lastSeenTimestamp) {
        setLastSeen(data.lastSeenTimestamp);
      }
    } catch (err) {
      console.error('Watchlist poll error', err);
    }
  }, []);

  // Client boot: Check hybrid local cache and initialize
  useEffect(() => {
    fetchCatalog();

    const storedSnapshots = localStorage.getItem(LOCAL_STORAGE_KEY_SNAPSHOTS);
    const storedLastSeen = localStorage.getItem(LOCAL_STORAGE_KEY_LASTSEEN);

    if (storedSnapshots && storedLastSeen) {
      // Rehydrate server with client fallback if cold start occurred
      fetch('/api/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          currentPrices: JSON.parse(storedSnapshots),
          clientTimestamp: Number(storedLastSeen)
        })
      }).then(() => fetchWatchlistData());
    } else {
      fetchWatchlistData();
    }

    // Adaptive polling loop
    const poller = setInterval(() => {
      pollCountRef.current += 1;
      fetchWatchlistData();
    }, 2800);

    return () => clearInterval(poller);
  }, [fetchWatchlistData]);

  // Checkpoint confirmation action ("Mark Caught Up")
  const handleAcknowledge = async () => {
    setSyncing(true);
    const now = Date.now();
    const prices: Record<string, number> = {};
    watchlist.forEach(w => { prices[w.symbol] = w.price; });

    // 1. Persist locally (fail-safe for device/serverless reboots)
    localStorage.setItem(LOCAL_STORAGE_KEY_SNAPSHOTS, JSON.stringify(prices));
    localStorage.setItem(LOCAL_STORAGE_KEY_LASTSEEN, now.toString());

    // 2. Persist to server
    await fetch('/api/checkpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        currentPrices: prices,
        clientTimestamp: now
      })
    });

    await fetchWatchlistData();
    setSyncing(false);
  };

  const handleToggle = async (symbol: string) => {
    await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, symbol })
    });
    fetchWatchlistData();
  };

  const timeAgo = (ms: number) => {
    if (!ms) return 'First visit';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const displayedList = filterAttention 
    ? watchlist.filter(item => item.attentionScore > 20) 
    : watchlist;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Platform Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-surfaceBorder pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentPrimary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accentPrimary"></span>
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              PulseWatch <span className="text-xs bg-emerald-500/10 text-accentPrimary font-mono px-2 py-0.5 rounded border border-emerald-500/20">GROWW ENG</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Differential market intelligence surfacing statistical anomalies & cross-session deltas.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-surface border border-surfaceBorder px-3 py-1.5 rounded-lg text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Checked: {timeAgo(lastSeen)}</span>
          </div>
          <button
            onClick={handleAcknowledge}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-accentPrimary hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncing ? 'Syncing...' : 'Mark Caught Up'}</span>
          </button>
        </div>
      </header>

      {/* Delta Intelligence (Meaningful Changes Since Last Check) */}
      {catchUpDeltas.length > 0 && (
        <section className="bg-gradient-to-r from-amber-950/20 via-surface to-surface border border-amber-500/30 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                What Has Meaningfully Changed Since Your Last Visit
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {catchUpDeltas.length} instruments prioritized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {catchUpDeltas.map(d => (
              <div key={d.symbol} className="bg-background/80 border border-surfaceBorder rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white tracking-wide">{d.symbol}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold ${d.deltaPct >= 0 ? 'text-accentPrimary' : 'text-rose-400'}`}>
                      {d.deltaPct > 0 ? `+${d.deltaPct}%` : `${d.deltaPct}%`}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Score {d.attentionScore}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-mono">
                  Checked at ₹{d.checkpointPrice.toFixed(2)} → Now <span className="text-white font-semibold">₹{d.currentPrice.toFixed(2)}</span>
                </p>

                <div className="space-y-1">
                  {d.signals.map((sig, i) => (
                    <div key={i} className="text-[11px] bg-surface border border-surfaceBorder text-slate-300 px-2 py-0.5 rounded flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{sig}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catalog & Filter Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Catalog:</span>
          {availableSymbols.map(sym => {
            const isTracked = watchlist.some(w => w.symbol === sym);
            return (
              <button
                key={sym}
                onClick={() => handleToggle(sym)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
                  isTracked
                    ? 'bg-emerald-950/40 text-accentPrimary border-emerald-500/40'
                    : 'bg-surface text-slate-400 border-surfaceBorder hover:border-slate-700'
                }`}
              >
                {isTracked ? <Check className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                {sym}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setFilterAttention(!filterAttention)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors ${
            filterAttention
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-surface border-surfaceBorder text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{filterAttention ? 'Showing Attention Outliers' : 'Filter by High Attention'}</span>
        </button>
      </section>

      {/* Watchlist Main Table/Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>TICKER & LIVE VALUATION</span>
          <span>SYSTEM ATTENTION SIGNALS</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {displayedList.map(stock => {
            const isUp = stock.priceChangePct >= 0;
            return (
              <div 
                key={stock.symbol}
                className="bg-surface/70 border border-surfaceBorder hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Side: Symbol & Core Pricing */}
                <div className="flex items-center gap-6 min-w-[260px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white tracking-wide">{stock.symbol}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-accentPrimary border border-emerald-500/20">
                        {stock.freshnessStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Vol: {(stock.volume / 1000).toFixed(0)}k shares</p>
                  </div>

                  <div>
                    <div className="text-lg font-mono font-bold text-white tracking-tight">
                      ₹{stock.price.toFixed(2)}
                    </div>
                    <div className={`flex items-center text-xs font-semibold font-mono ${isUp ? 'text-accentPrimary' : 'text-rose-400'}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{stock.priceChangeAbs > 0 ? `+${stock.priceChangeAbs}` : stock.priceChangeAbs} ({stock.priceChangePct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Center: Quantitative Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-t md:border-t-0 md:border-l border-surfaceBorder md:pl-5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">52W Range</span>
                    <span className="text-slate-300">₹{stock.low52w} - ₹{stock.high52w}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">RSI (14)</span>
                    <span className={stock.rsi14 >= 70 ? 'text-amber-400 font-bold' : stock.rsi14 <= 30 ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                      {stock.rsi14}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Vol Pacing</span>
                    <span className={stock.volZScore > 1.5 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {stock.volZScore > 0 ? `+${stock.volZScore}σ` : `${stock.volZScore}σ`}
                    </span>
                  </div>
                </div>

                {/* Right: Surfaced Actionable Anomalies */}
                <div className="flex-1 flex flex-wrap items-center justify-start md:justify-end gap-1.5 border-t md:border-t-0 border-surfaceBorder pt-3 md:pt-0">
                  {stock.signals.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Orderly Trading</span>
                    </div>
                  ) : (
                    stock.signals.map((sig, i) => (
                      <div 
                        key={i}
                        title={sig.description}
                        className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                          sig.severity === 'HIGH'
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="font-medium text-[11px]">{sig.headline}</span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
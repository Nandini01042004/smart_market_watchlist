PulseWatch solves **information blindness** in traditional trading dashboards. Instead of forcing users to mentally calculate changes across dozens of red and green badges, PulseWatch dynamically detects statistical anomalies, computes cross-session price and volume deltas, and presents a prioritized catch-up briefing whenever a user returns.

---

## Core Features

* **Catch-Up Intelligence Drawer:** Displays a differential briefing summarizing what shifted since the user's prior session.
* **Evaluator Time-Travel Simulator:** Integrated navbar controls (`+2h Away`, `+24h Away`) that allow judges to simulate leaving and returning hours or days later to test the delta engine on demand.
* **Micro-Sparklines:** Native SVG momentum sparklines that track intraday price action without heavy third-party graphing libraries.
* **52-Week Range Sliders:** Visual indicator bars showing the instrument's exact position between yearly support and resistance levels.
* **Dynamic Watchlist Management:** One-click tracking controls to add or remove instruments from an active catalog.

---

## What Counts as a "Meaningful Change"?

PulseWatch avoids raw threshold noise by combining multiple technical and statistical factors:

1. **Intraday Gap & Velocity:** Swings $\ge 1.5\%$ trigger informational tracking; swings $\ge 3.0\%$ trigger high-priority alerts.
2. **Volume Pacing $Z$-Scores:** Normalizes intraday traded volume against historical 30-day baseline run rates. Surges $> +1.5\sigma$ trigger volume outlier flags.
3. **52-Week Structural Extremes:** Alerts when an instrument trades within $1\%$ of its annual high or low boundary.
4. **Momentum Exhaustion:** Detects mean-reversion zones when RSI(14) breaches $> 75$ (overbought) or $< 25$ (oversold).

---

## Resilience & Engineering Depth

* **Cross-Session Durability:** Implements a hybrid persistence model combining client-side `localStorage` caching with server-side checkpoint synchronization. User checkpoints survive serverless cold starts, container recycles, and tab closures.
* **Data Stream Integrity:** Uses an `IngestionEngine` with strictly monotonic sequence verification (`sequenceId`) to reject delayed or out-of-order network packets, along with clock-skew detection for corrupted timestamps ($> 3$ minutes drift).
* **Unified Full-Stack Architecture:** Built with Next.js 14 App Router, co-locating server APIs (`/api/watchlist`, `/api/checkpoint`, `/api/symbols`) with client components to prevent cross-origin resource sharing (CORS) overhead.

---

## Local Setup

```bash
# Clone repository
git clone [https://github.com/](https://github.com/)<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
cd grow

# Install dependencies
npm install

# Run development server
npm run dev
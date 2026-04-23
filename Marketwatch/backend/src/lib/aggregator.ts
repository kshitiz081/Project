type Tick = { symbol: string; price: number; ts: number };

type Subscriber = (d: any) => void;

type AlertThresholds = { highPrice?: number; lowPrice?: number; volatility?: number };

export class Aggregator {
  private windows: Map<string, Tick[]> = new Map();
  private subs: Set<Subscriber> = new Set();
  private windowMs: number;
  private alertStates: Map<string, { highTriggered?: boolean; lowTriggered?: boolean; volatilityTriggered?: boolean }> = new Map();
  private thresholds: AlertThresholds;

  constructor(windowMs = 60_000, thresholds: AlertThresholds = {}) {
    this.windowMs = windowMs;
    this.thresholds = {
      highPrice: thresholds.highPrice ?? 200,      // Alert if avg > $200
      lowPrice: thresholds.lowPrice ?? 50,         // Alert if avg < $50
      volatility: thresholds.volatility ?? 30,     // Alert if spread > $30
    };
  }

  ingest(tick: Tick) {
    const key = tick.symbol;
    if (!this.windows.has(key)) this.windows.set(key, []);
    const buf = this.windows.get(key)!;
    buf.push(tick);
    this.trim(buf);
    const metrics = this.compute(buf);
    
    // Check for alerts
    const alerts = this.checkAlerts(key, metrics);
    
    // Emit both metrics and alerts
    this.emit({ symbol: key, metrics, alerts, ts: Date.now() });
  }

  private checkAlerts(symbol: string, metrics: any) {
    if (!metrics) return [];
    
    const alerts = [];
    const state = this.alertStates.get(symbol) || {};
    
    // High price alert
    if (metrics.avg > this.thresholds.highPrice! && !state.highTriggered) {
      alerts.push({ type: 'HIGH_PRICE', symbol, value: metrics.avg, threshold: this.thresholds.highPrice });
      state.highTriggered = true;
    } else if (metrics.avg <= this.thresholds.highPrice! && state.highTriggered) {
      alerts.push({ type: 'HIGH_PRICE_CLEARED', symbol, value: metrics.avg });
      state.highTriggered = false;
    }
    
    // Low price alert
    if (metrics.avg < this.thresholds.lowPrice! && !state.lowTriggered) {
      alerts.push({ type: 'LOW_PRICE', symbol, value: metrics.avg, threshold: this.thresholds.lowPrice });
      state.lowTriggered = true;
    } else if (metrics.avg >= this.thresholds.lowPrice! && state.lowTriggered) {
      alerts.push({ type: 'LOW_PRICE_CLEARED', symbol, value: metrics.avg });
      state.lowTriggered = false;
    }
    
    // Volatility alert
    const spread = metrics.max - metrics.min;
    if (spread > this.thresholds.volatility! && !state.volatilityTriggered) {
      alerts.push({ type: 'HIGH_VOLATILITY', symbol, spread, threshold: this.thresholds.volatility });
      state.volatilityTriggered = true;
    } else if (spread <= this.thresholds.volatility! && state.volatilityTriggered) {
      alerts.push({ type: 'HIGH_VOLATILITY_CLEARED', symbol, spread });
      state.volatilityTriggered = false;
    }
    
    this.alertStates.set(symbol, state);
    return alerts;
  }

  private trim(buf: Tick[]) {
    const cutoff = Date.now() - this.windowMs;
    while (buf.length && buf[0].ts < cutoff) buf.shift();
  }

  private compute(buf: Tick[]) {
    if (!buf.length) return null;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const t of buf) {
      sum += t.price;
      if (t.price < min) min = t.price;
      if (t.price > max) max = t.price;
    }
    return { avg: sum / buf.length, min, max, count: buf.length };
  }

  getMetrics(symbol: string) {
    const buf = this.windows.get(symbol);
    if (!buf) return null;
    return this.compute(buf);
  }

  subscribe(fn: Subscriber) {
    this.subs.add(fn);
    return { unsubscribe: () => this.subs.delete(fn) };
  }

  private emit(data: any) {
    for (const s of this.subs) {
      try { s(data); } catch (e) { /* noop */ }
    }
  }
}

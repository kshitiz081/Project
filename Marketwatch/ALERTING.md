# Alerting Feature

MarketWatch now includes real-time alerting based on configurable thresholds.

## Alert Types

1. **HIGH_PRICE** — Triggered when average price exceeds threshold (default: $150)
   - Cleared when price drops back below threshold
   
2. **LOW_PRICE** — Triggered when average price drops below threshold (default: $80)
   - Cleared when price rises back above threshold
   
3. **HIGH_VOLATILITY** — Triggered when price spread (max - min) exceeds threshold (default: $25)
   - Cleared when volatility stabilizes below threshold

## Configuration

Thresholds are configured in `backend/src/index.ts`:

```typescript
const aggregator = new Aggregator(60_000, {
  highPrice: 150,    // Alert when avg > $150
  lowPrice: 80,      // Alert when avg < $80
  volatility: 25     // Alert when spread > $25
});
```

## How It Works

1. **Backend (Aggregator)**:
   - After each metric computation, checks if thresholds are crossed
   - Emits alert events via the pub/sub stream
   - Maintains alert state to avoid duplicate triggers

2. **Frontend (Dashboard)**:
   - Receives alert events from SSE stream
   - Displays alerts in a colored banner at the top
   - Shows symbol, alert type, and relevant values
   - Auto-dismisses via close button

## Example

Send a high-price tick to trigger an alert:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/ingest `
  -Body (@{"symbol"="AAPL";"price"=200} | ConvertTo-Json) `
  -ContentType "application/json"
```

You should see an alert banner appear on the dashboard immediately:
```
⚠️ AAPL — HIGH_PRICE ($200)
```

## Interview Talking Points

- **Alert Deduplication**: Uses state tracking to emit each alert only once, then clears when condition resolves
- **Low Latency**: Alerts computed inline during metric aggregation (~1ms)
- **Scalability**: Could extend to distributed systems with:
  - Redis pub/sub for multi-worker alerting
  - Kafka topics for alert history
  - WebSocket upgrades for lower latency
- **False Positive Mitigation**: Configurable hysteresis (separate clear threshold)
- **Extensibility**: Easy to add new alert types (price gap, trend detection, etc.)

Architecture (overview)

1) Ingestion
- HTTP POST /ingest accepts tick events: { symbol, price, ts }
- Validates and enqueues events to the aggregator (in-process ring buffers for each symbol)

2) Aggregation
- Per-symbol sliding-window aggregator (configurable window, e.g., 1m, 5m) maintained in-memory for low latency.
- Computes moving average, min/max, and throughput.
- Emits derived events to SSE stream and alerting pipeline when thresholds are crossed.

3) Streaming & Dashboard
- SSE endpoint /stream broadcasts aggregated updates to connected dashboards.
- React dashboard subscribes and plots live charts.




























































4) Scaling notes
- For production, replace in-memory with Redis (streams + sorted sets) or Kafka for persistence and durability.
- Use partitioning by symbol and consumer groups to horizontally scale consumers.
- Add metrics (Prometheus) and tracing (OpenTelemetry) for observability.

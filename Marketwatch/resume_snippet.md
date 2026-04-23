MarketWatch — Real-time Market Data Aggregation & Alerting

Short description (one line):
Built a TypeScript-based real-time market-data aggregation and alerting platform with end-to-end ingestion, streaming APIs, and a React live dashboard to monitor and surface trading signals.

Resume bullets (pick 2–3):
- Designed and implemented MarketWatch: a full-stack, TypeScript-based real-time data ingestion and monitoring system. Built an ingestion API, a low-latency in-memory aggregation engine, and a React dashboard consuming an SSE stream to display live metrics and alerts.
- Implemented a sliding-window aggregator and optimized event processing to achieve sub-10ms median processing time per event in local tests and reduced data staleness using compact queues and incremental updates.
- Containerized services and added GitHub Actions CI to build, test, and lint both backend and frontend; created end-to-end tests that validate streaming correctness and alert triggers.

Technologies: TypeScript, Node.js, Express, React, Vite, Server-Sent Events, Docker, GitHub Actions, Jest.

Interview talking points:
- Explain design choices: why SSE vs WebSocket, in-memory aggregation trade-offs, sliding window complexity, and how to extend to distributed systems (sharding, Kafka/SQS, checkpointing).
- Metrics you can claim and justify: average event processing latency, throughput (events/sec), end-to-end dashboard latency, and alert false-positive mitigation strategies.
- Extensions for scale: persistence with RocksDB or Redis Streams, exactly-once processing with Kafka and idempotent producers, horizontal autoscaling, and partition-aware aggregation.

# MarketWatch — Real-time Market Data Aggregation & Alerting

MarketWatch is a full-stack, real-time data ingestion, aggregation, and alerting platform built with TypeScript, Node.js and React. It simulates a production-grade service that ingests streaming market ticks, computes aggregated metrics, exposes an SSE stream for real-time dashboards, and provides alerting hooks and observability.

Why this project? It demonstrates system design, performance-aware engineering, observable event-driven architecture, CI/CD, and full-stack delivery — the kind of end-to-end work FAANG hiring teams look for.

Highlights

- Real-time data ingestion API (REST) and Server-Sent Events (SSE) streaming endpoint for live dashboards.
- Aggregation engine that computes sliding-window metrics (moving average, throughput) with O(1) amortized updates.
- React dashboard displaying live charts and alerts.
- TypeScript across backend and frontend, Dockerfiles, and GitHub Actions CI.

Quick start (development)

**From the project root (`faang-marketwatch/`):**

1. Install both backend & frontend:
   ```
   npm ci
   ```

2. Run backend (terminal 1):
   ```
   npm run start:backend
   ```

3. Run frontend (terminal 2):
   ```
   npm run start:frontend
   ```

4. Open frontend at http://localhost:5173

5. Simulate ingestion (PowerShell, terminal 3):
   ```powershell
   Invoke-RestMethod -Method Post -Uri http://localhost:4000/ingest -Body (@{"symbol"="ACME";"price"=123.45;"ts"=(Get-Date).ToString()} | ConvertTo-Json) -ContentType "application/json"
   ```

6. Run all tests:
   ```
   npm run test
   ```

What's included

- `backend/` — Express + TypeScript server with ingestion, in-memory aggregation, SSE stream, unit test.
- `frontend/` — React + Vite TypeScript app that subscribes to SSE and renders charts.
- `.github/workflows/ci.yml` — CI to build & run tests.
- `resume_snippet.md` — paste-ready resume bullets and interview talking points.

See `resume_snippet.md` for a concise, impact-oriented project description you can drop into your CV.

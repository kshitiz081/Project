import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Aggregator } from './lib/aggregator';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const aggregator = new Aggregator(60_000, {
  highPrice: 150,    // Alert when avg price > $150
  lowPrice: 80,      // Alert when avg price < $80
  volatility: 25     // Alert when spread > $25
});

// Ingest endpoint
app.post('/ingest', (req, res) => {
  const { symbol, price, ts } = req.body || {};
  if (!symbol || typeof price !== 'number') {
    return res.status(400).json({ error: 'invalid payload' });
  }
  aggregator.ingest({ symbol, price, ts: ts || Date.now() });
  return res.status(202).json({ status: 'accepted' });
});

// SSE stream for aggregated updates
app.get('/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const sub = aggregator.subscribe(send);
  req.on('close', () => {
    sub.unsubscribe();
  });
});

// Simple metrics
app.get('/metrics/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  const m = aggregator.getMetrics(symbol);
  if (!m) return res.status(404).json({ error: 'not found' });
  res.json(m);
});

app.listen(PORT, () => console.log(`MarketWatch backend listening on ${PORT}`));

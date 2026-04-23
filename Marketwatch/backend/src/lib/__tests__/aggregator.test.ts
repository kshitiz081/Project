import { Aggregator } from '../aggregator'

test('aggregator computes avg/min/max/count', () => {
  const a = new Aggregator(1000 * 60)
  const now = Date.now()
  a.ingest({ symbol: 'ACME', price: 10, ts: now - 1000 })
  a.ingest({ symbol: 'ACME', price: 20, ts: now - 500 })
  const m = a.getMetrics('ACME')
  expect(m).not.toBeNull()
  expect(m!.count).toBe(2)
  expect(m!.avg).toBe(15)
  expect(m!.min).toBe(10)
  expect(m!.max).toBe(20)
})

test('aggregator triggers high price alert', () => {
  const a = new Aggregator(1000 * 60, { highPrice: 100 })
  const now = Date.now()
  const alerts: any[] = []
  
  a.subscribe((d) => {
    if (d.alerts) alerts.push(...d.alerts)
  })
  
  // First tick at 150 should trigger HIGH_PRICE alert
  a.ingest({ symbol: 'STOCK', price: 150, ts: now })
  expect(alerts.some(al => al.type === 'HIGH_PRICE')).toBe(true)
  
  // Second tick at 50 should trigger HIGH_PRICE_CLEARED alert
  a.ingest({ symbol: 'STOCK', price: 50, ts: now + 1000 })
  expect(alerts.some(al => al.type === 'HIGH_PRICE_CLEARED')).toBe(true)
})

test('aggregator triggers volatility alert', () => {
  const a = new Aggregator(1000 * 60, { volatility: 20 })
  const now = Date.now()
  const alerts: any[] = []
  
  a.subscribe((d) => {
    if (d.alerts) alerts.push(...d.alerts)
  })
  
  // Prices with spread > 20 should trigger HIGH_VOLATILITY
  a.ingest({ symbol: 'TECH', price: 100, ts: now })
  a.ingest({ symbol: 'TECH', price: 130, ts: now + 100 })
  expect(alerts.some(al => al.type === 'HIGH_VOLATILITY')).toBe(true)
})

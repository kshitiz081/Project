import React, { useEffect, useState, useRef } from 'react'

type Metrics = { symbol: string; metrics: { avg: number; min: number; max: number; count: number }; ts: number }
type Alert = { type: string; symbol: string; value?: number; threshold?: number; spread?: number; ts: number }

export default function App(){
  const [rows, setRows] = useState<Metrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'symbol' | 'avg' | 'count'>('symbol')
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const evtSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const s = new EventSource('http://localhost:4000/stream')
    s.onmessage = (e) => {
      try{
        const d: any = JSON.parse(e.data)
        
        // Update metrics
        setRows(prev => {
          const map = new Map(prev.map(r=>[r.symbol, r]))
          map.set(d.symbol, d)
          return Array.from(map.values()).slice(-50)
        })
        
        // Handle alerts
        if (d.alerts && d.alerts.length > 0) {
          setAlerts(prev => {
            const newAlerts = d.alerts.map((a: any) => ({ ...a, symbol: d.symbol, ts: Date.now() }))
            const combined = [...prev, ...newAlerts]
            // Keep last 10 alerts, auto-remove cleared alerts after 5 seconds
            return combined.filter((_, i) => i >= combined.length - 10).slice(-10)
          })
        }
      }catch(e){console.error(e)}
    }
    evtSourceRef.current = s
    return () => s.close()
  },[])

  const filtered = rows
    .filter(r => r.symbol.toUpperCase().includes(searchTerm.toUpperCase()))
    .sort((a, b) => {
      if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol)
      if (sortBy === 'avg') return b.metrics.avg - a.metrics.avg
      return b.metrics.count - a.metrics.count
    })

  const stats = rows.length > 0 ? {
    avgPrice: (rows.reduce((s, r) => s + r.metrics.avg, 0) / rows.length).toFixed(2),
    highestSymbol: rows.reduce((max, r) => r.metrics.max > max.metrics.max ? r : max),
    lowestSymbol: rows.reduce((min, r) => r.metrics.min < min.metrics.min ? r : min),
    totalTicks: rows.reduce((s, r) => s + r.metrics.count, 0)
  } : null

  return (
    <div style={{background:'#f5f7fa', minHeight:'100vh', fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana"}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'white', padding:'30px 40px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
        <h1 style={{margin:0, fontSize:28, fontWeight:600}}>📈 MarketWatch</h1>
        <p style={{margin:'8px 0 0 0', opacity:0.9, fontSize:14}}>Real-time Market Data Aggregation & Live Metrics</p>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:'30px 20px'}}>
        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div style={{marginBottom:20}}>
            {alerts.map((alert, i) => {
              const isCleared = alert.type.includes('CLEARED')
              const bgColor = alert.type.includes('HIGH') ? '#fff3cd' : alert.type.includes('LOW') ? '#d6e9ff' : '#fff3cd'
              const borderColor = alert.type.includes('HIGH') ? '#ffc107' : alert.type.includes('LOW') ? '#0d6efd' : '#ffc107'
              const icon = alert.type.includes('HIGH_PRICE') ? '⚠️' : alert.type.includes('LOW_PRICE') ? 'ℹ️' : '⚡'
              
              return (
                <div key={i} style={{
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 14,
                  opacity: isCleared ? 0.7 : 1
                }}>
                  <span>{icon} <strong>{alert.symbol}</strong> — {alert.type.replace(/_/g, ' ')} 
                    {alert.value !== undefined && ` ($${alert.value.toFixed(2)})`}
                    {alert.spread !== undefined && ` (spread: $${alert.spread.toFixed(2)})`}
                  </span>
                  <button onClick={() => setAlerts(prev => prev.filter((_, j) => j !== i))} 
                    style={{background:'none', border:'none', cursor:'pointer', fontSize:18}}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:20, marginBottom:30}}>
            <StatCard label="Avg Price" value={`$${stats.avgPrice}`} color="#667eea" />
            <StatCard label="Highest" value={`${stats.highestSymbol.symbol} @ $${stats.highestSymbol.metrics.max.toFixed(2)}`} color="#00d084" />
            <StatCard label="Lowest" value={`${stats.lowestSymbol.symbol} @ $${stats.lowestSymbol.metrics.min.toFixed(2)}`} color="#ff6b6b" />
            <StatCard label="Total Ticks" value={stats.totalTicks.toString()} color="#ffa502" />
          </div>
        )}

        {/* Controls */}
        <div style={{background:'white', borderRadius:12, padding:20, marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex', gap:20, flexWrap:'wrap', alignItems:'center'}}>
            <input
              type="text"
              placeholder="Search symbol (e.g., ACME)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{flex:1, minWidth:200, padding:'12px 16px', border:'1px solid #e0e6ed', borderRadius:8, fontSize:14, outline:'none'}}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{padding:'12px 16px', border:'1px solid #e0e6ed', borderRadius:8, fontSize:14, background:'white', cursor:'pointer'}}
            >
              <option value="symbol">Sort: Symbol</option>
              <option value="avg">Sort: Avg Price</option>
              <option value="count">Sort: Tick Count</option>
            </select>
            <div style={{fontSize:13, color:'#666'}}>
              {filtered.length} symbol{filtered.length !== 1 ? 's' : ''} • {rows.length} total
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{display:'grid', gridTemplateColumns:selectedSymbol ? '1fr 350px' : '1fr', gap:20}}>
          {/* Table */}
          <div style={{background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{overflowX:'auto', maxHeight:600, overflowY:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                <thead style={{background:'#f8fafc', stickyTop:0}}>
                  <tr>
                    <th style={{padding:'16px', textAlign:'left', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Symbol</th>
                    <th style={{padding:'16px', textAlign:'right', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Avg</th>
                    <th style={{padding:'16px', textAlign:'right', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Min</th>
                    <th style={{padding:'16px', textAlign:'right', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Max</th>
                    <th style={{padding:'16px', textAlign:'center', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Spread</th>
                    <th style={{padding:'16px', textAlign:'center', fontWeight:600, color:'#333', borderBottom:'1px solid #e0e6ed'}}>Ticks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const spread = (r.metrics.max - r.metrics.min).toFixed(2)
                    const isSelected = selectedSymbol === r.symbol
                    return (
                      <tr 
                        key={r.symbol}
                        onClick={() => setSelectedSymbol(isSelected ? null : r.symbol)}
                        style={{
                          borderBottom:'1px solid #e0e6ed',
                          background:isSelected ? '#f0f4ff' : 'white',
                          cursor:'pointer',
                          transition:'background 0.2s'
                        }}
                        onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{padding:'16px', fontWeight:600, color:'#667eea'}}>{r.symbol}</td>
                        <td style={{padding:'16px', textAlign:'right', color:'#333'}}>${r.metrics.avg.toFixed(2)}</td>
                        <td style={{padding:'16px', textAlign:'right', color:'#00d084'}}>${r.metrics.min.toFixed(2)}</td>
                        <td style={{padding:'16px', textAlign:'right', color:'#ff6b6b'}}>${r.metrics.max.toFixed(2)}</td>
                        <td style={{padding:'16px', textAlign:'center', color:'#666', fontSize:13}}>${spread}</td>
                        <td style={{padding:'16px', textAlign:'center', color:'#666'}}>{r.metrics.count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Symbol Detail */}
          {selectedSymbol && rows.find(r => r.symbol === selectedSymbol) && (
            <div style={{background:'white', borderRadius:12, padding:20, height:'fit-content', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{marginBottom:20}}>
                <h3 style={{margin:0, fontSize:20, color:'#333'}}>{selectedSymbol}</h3>
                <p style={{margin:'8px 0 0 0', fontSize:12, color:'#999'}}>Click to deselect</p>
              </div>
              {rows.find(r => r.symbol === selectedSymbol) && (() => {
                const data = rows.find(r => r.symbol === selectedSymbol)!
                return (
                  <div style={{display:'grid', gap:12}}>
                    <DetailItem label="Average" value={`$${data.metrics.avg.toFixed(2)}`} color="#667eea" />
                    <DetailItem label="Min Price" value={`$${data.metrics.min.toFixed(2)}`} color="#00d084" />
                    <DetailItem label="Max Price" value={`$${data.metrics.max.toFixed(2)}`} color="#ff6b6b" />
                    <DetailItem label="Range" value={`$${(data.metrics.max - data.metrics.min).toFixed(2)}`} color="#ffa502" />
                    <DetailItem label="Ticks" value={data.metrics.count.toString()} color="#667eea" />
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({label, value, color}: {label: string; value: string; color: string}) {
  return (
    <div style={{background:'white', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${color}`}}>
      <div style={{fontSize:12, color:'#999', marginBottom:8}}>{label}</div>
      <div style={{fontSize:24, fontWeight:600, color}}>{value}</div>
    </div>
  )
}

function DetailItem({label, value, color}: {label: string; value: string; color: string}) {
  return (
    <div style={{padding:12, background:'#f8fafc', borderRadius:8, borderLeft:`3px solid ${color}`}}>
      <div style={{fontSize:12, color:'#999'}}>{label}</div>
      <div style={{fontSize:16, fontWeight:600, color, marginTop:4}}>{value}</div>
    </div>
  )
}

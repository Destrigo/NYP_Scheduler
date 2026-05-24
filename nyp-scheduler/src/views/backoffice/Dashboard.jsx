import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { STORES, LABOR_WARNING_PCT } from '../../constants.js'
import { today, getMonday, addDays, workedHours } from '../../utils.js'
import BarChart from '../../components/charts/BarChart.jsx'

export default function Dashboard() {
  const [range,       setRange]       = useState('week')
  const [filterStore, setFilterStore] = useState('all')
  const [data,        setData]        = useState([])
  const [prevData,    setPrevData]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)

  function getDateRange(period, offset = 0) {
    const now = new Date()
    if (period === 'day') {
      const d = addDays(today(), -offset)
      return { start: d, end: d }
    }
    if (period === 'week') {
      const s = getMonday(addDays(today(), -offset * 7))
      return { start: s, end: addDays(s, 6) }
    }
    // month
    const year  = now.getFullYear()
    const month = ((now.getMonth() - offset) + 12) % 12 + 1
    const yr    = year + Math.floor((now.getMonth() - offset) / 12)
    const s = `${yr}-${String(month).padStart(2, '0')}-01`
    const e = new Date(yr, month, 0).toISOString().slice(0, 10)
    return { start: s, end: e }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)
      const { start, end }        = getDateRange(range, 0)
      const { start: ps, end: pe} = getDateRange(range, 1)

      const [shiftsRes, revsRes, empsRes, pShiftsRes, pRevsRes] = await Promise.all([
        supabase.from('shifts').select('*').gte('date', start).lte('date', end),
        supabase.from('daily_revenues').select('*').gte('date', start).lte('date', end),
        supabase.from('employees').select('id, hourly_rate, store_id'),
        supabase.from('shifts').select('*').gte('date', ps).lte('date', pe),
        supabase.from('daily_revenues').select('*').gte('date', ps).lte('date', pe),
      ])

      const err = shiftsRes.error || revsRes.error || empsRes.error
      if (err) { setLoadError(err.message); setLoading(false); return }

      const shifts = shiftsRes.data || []
      const revs   = revsRes.data   || []
      const emps   = empsRes.data   || []
      const pShifts = pShiftsRes.data || []
      const pRevs   = pRevsRes.data   || []

      setData(computeStats(STORES, shifts, revs, emps))
      setPrevData(computeStats(STORES, pShifts, pRevs, emps))
      setLoading(false)
    }
    load()
  }, [range])

  function computeStats(stores, shifts, revs, emps) {
    return stores.map(store => {
      const ss = shifts.filter(s => s.store_id === store.id)
      const rs = revs.filter(r => r.store_id === store.id)
      const cost    = ss.reduce((a, s) => {
        const e = emps.find(x => x.id === s.employee_id)
        return a + (e ? workedHours(s.start_time, s.end_time, s.break_minutes) * e.hourly_rate : 0)
      }, 0)
      const hours   = ss.reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
      const revenue = rs.reduce((a, r) => a + r.revenue_amount, 0)
      const laborPct = revenue > 0 ? (cost / revenue) * 100 : null
      const staff   = new Set(ss.map(s => s.employee_id)).size
      return { store, cost, hours, revenue, laborPct, staff }
    })
  }

  const filtered = data.filter(d => filterStore === 'all' || d.store.id === Number(filterStore))
  const fPrev    = prevData.filter(d => filterStore === 'all' || d.store.id === Number(filterStore))

  const totCost = filtered.reduce((a, d) => a + d.cost, 0)
  const totRev  = filtered.reduce((a, d) => a + d.revenue, 0)
  const avgPct  = totRev > 0 ? (totCost / totRev) * 100 : null

  const pTotCost = fPrev.reduce((a, d) => a + d.cost, 0)
  const pTotRev  = fPrev.reduce((a, d) => a + d.revenue, 0)
  const pAvgPct  = pTotRev > 0 ? (pTotCost / pTotRev) * 100 : null

  function delta(curr, prev) {
    if (prev == null || prev === 0) return null
    return ((curr - prev) / prev) * 100
  }

  const chartData = filtered.map(d => ({ label: d.store.name, value: d.laborPct ?? 0 }))

  if (loading)   return <div className="loading-center"><div className="loading-spinner" /> Loading…</div>
  if (loadError) return <div className="alert alert-error">Failed to load dashboard: {loadError}</div>

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['day','week','month'].map(r => (
          <button key={r} className={`tab-btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}
            style={{ padding: '6px 14px', fontSize: 13 }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select
          value={filterStore}
          onChange={e => setFilterStore(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="all">All stores</option>
          {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Metric cards */}
      <div className="metrics-grid">
        <MetricCard label="Labor Cost" value={`€${totCost.toFixed(0)}`} delta={delta(totCost, pTotCost)} invertDelta />
        <MetricCard label="Revenue" value={totRev > 0 ? `€${totRev.toFixed(0)}` : '—'} delta={delta(totRev, pTotRev)} />
        <MetricCard
          label="Avg Labor %"
          value={avgPct != null ? `${avgPct.toFixed(1)}%` : '—'}
          delta={pAvgPct != null && avgPct != null ? avgPct - pAvgPct : null}
          invertDelta
          valueStyle={avgPct != null && avgPct > LABOR_WARNING_PCT ? { color: 'var(--danger)' } : {}}
        />
      </div>

      {/* Bar chart */}
      {chartData.some(d => d.value > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Labor % by Store</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>red bar = above {LABOR_WARNING_PCT}% threshold</span>
          </div>
          <BarChart data={chartData} threshold={LABOR_WARNING_PCT} />
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header"><div className="card-title">Store Breakdown</div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>City</th>
                <th>Staff</th>
                <th>Hours</th>
                <th>Labor Cost</th>
                <th>Revenue</th>
                <th>Labor %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ store, staff, hours, cost, revenue, laborPct }) => {
                const high = laborPct != null && laborPct > LABOR_WARNING_PCT
                return (
                  <tr key={store.id} className={high ? 'labor-high' : ''}>
                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{store.city}</td>
                    <td>{staff}</td>
                    <td>{hours.toFixed(1)}h</td>
                    <td>€{cost.toFixed(0)}</td>
                    <td>{revenue > 0 ? `€${revenue.toFixed(0)}` : <span style={{ color: 'var(--text-subtle)' }}>—</span>}</td>
                    <td>
                      {laborPct != null ? `${laborPct.toFixed(1)}%` : '—'}
                      {high && ' ⚠'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, delta, invertDelta, valueStyle = {} }) {
  let deltaClass = 'neutral', deltaLabel = null
  if (delta != null) {
    const isUp = delta > 0
    deltaClass = (isUp && !invertDelta) || (!isUp && invertDelta) ? 'down' : 'up'
    deltaLabel = `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}% vs prev period`
  }
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={valueStyle}>{value}</div>
      {deltaLabel && <div className={`metric-delta ${deltaClass}`}>{deltaLabel}</div>}
    </div>
  )
}

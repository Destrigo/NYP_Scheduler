import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { STORES, LABOR_WARNING_PCT } from '../../constants.js'
import { today, getMonday, addDays, workedHours, fmtDateShort } from '../../utils.js'
import LineChart from '../../components/charts/LineChart.jsx'
import EmptyState from '../../components/shared/EmptyState.jsx'

const NUM_WEEKS = 8

export default function Reports() {
  const [selectedStores, setSelectedStores] = useState(new Set([1, 2, 3, 7]))
  const [sortCol, setSortCol]       = useState('name')
  const [sortDir, setSortDir]       = useState(1)
  const [chartData, setChartData]   = useState([])
  const [tableData, setTableData]   = useState([])
  const [xLabels,   setXLabels]     = useState([])
  const [loading,   setLoading]     = useState(true)

  // Weeks: last NUM_WEEKS weeks ending with current week
  const weeks = Array.from({ length: NUM_WEEKS }, (_, i) =>
    getMonday(addDays(today(), -(NUM_WEEKS - 1 - i) * 7))
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      const from = weeks[0]
      const to   = addDays(weeks[NUM_WEEKS - 1], 6)

      const [shiftsRes, revsRes, empsRes] = await Promise.all([
        supabase.from('shifts').select('*').gte('date', from).lte('date', to),
        supabase.from('daily_revenues').select('*').gte('date', from).lte('date', to),
        supabase.from('employees').select('id, hourly_rate, store_id'),
      ])

      const shifts = shiftsRes.data || []
      const revs   = revsRes.data   || []
      const emps   = empsRes.data   || []

      // Build per-store, per-week labor %
      const series = STORES.filter(s => selectedStores.has(s.id)).map(store => {
        const data = weeks.map(wk => {
          const wEnd = addDays(wk, 6)
          const ws   = shifts.filter(s => s.store_id === store.id && s.date >= wk && s.date <= wEnd)
          const wr   = revs.filter(r => r.store_id === store.id && r.date >= wk && r.date <= wEnd)
          const cost = ws.reduce((a, s) => {
            const e = emps.find(x => x.id === s.employee_id)
            return a + (e ? workedHours(s.start_time, s.end_time, s.break_minutes) * e.hourly_rate : 0)
          }, 0)
          const rev = wr.reduce((a, r) => a + r.revenue_amount, 0)
          return rev > 0 ? (cost / rev) * 100 : null
        })
        return { name: store.name, data }
      })

      // Table: last week summary per store
      const lastWk  = weeks[NUM_WEEKS - 1]
      const lastEnd = addDays(lastWk, 6)
      const tableRows = STORES.map(store => {
        const ws   = shifts.filter(s => s.store_id === store.id && s.date >= lastWk && s.date <= lastEnd)
        const wr   = revs.filter(r => r.store_id === store.id && r.date >= lastWk && r.date <= lastEnd)
        const cost = ws.reduce((a, s) => {
          const e = emps.find(x => x.id === s.employee_id)
          return a + (e ? workedHours(s.start_time, s.end_time, s.break_minutes) * e.hourly_rate : 0)
        }, 0)
        const rev  = wr.reduce((a, r) => a + r.revenue_amount, 0)
        const pct  = rev > 0 ? (cost / rev) * 100 : null
        const hrs  = ws.reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
        return { store, cost, rev, pct, hrs, staff: new Set(ws.map(s => s.employee_id)).size }
      })

      setChartData(series)
      setTableData(tableRows)
      setXLabels(weeks.map(w => fmtDateShort(w).split(',')[0] + '\n' +
        new Date(w + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })))
      setLoading(false)
    }
    load()
  }, [selectedStores.size]) // reload when store selection changes

  function sortedTable() {
    return [...tableData].sort((a, b) => {
      let av, bv
      if (sortCol === 'name')    { av = a.store.name;  bv = b.store.name }
      if (sortCol === 'pct')     { av = a.pct ?? -1;   bv = b.pct ?? -1 }
      if (sortCol === 'cost')    { av = a.cost;         bv = b.cost }
      if (sortCol === 'rev')     { av = a.rev;          bv = b.rev }
      if (av < bv) return -sortDir
      if (av > bv) return  sortDir
      return 0
    })
  }

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => -d)
    else { setSortCol(col); setSortDir(-1) }
  }

  function SortTh({ col, children }) {
    const active = sortCol === col
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {children} {active ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  const highStores = tableData.filter(d => d.pct != null && d.pct > LABOR_WARNING_PCT)

  if (loading) return <div className="loading-center"><div className="loading-spinner" /> Loading…</div>

  return (
    <div>
      {highStores.length > 0 && (
        <div className="alert alert-error">
          <strong>High labor cost:</strong>{' '}
          {highStores.map(d => d.store.name).join(', ')} exceed {LABOR_WARNING_PCT}% this week.
        </div>
      )}

      {/* Store selector for chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Labor % Trend — Last {NUM_WEEKS} Weeks</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {STORES.map(s => {
            const on = selectedStores.has(s.id)
            return (
              <button
                key={s.id}
                className={`btn btn-xs ${on ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  const next = new Set(selectedStores)
                  on ? next.delete(s.id) : next.add(s.id)
                  setSelectedStores(next)
                }}
              >
                {s.name}
              </button>
            )
          })}
        </div>
        {chartData.every(s => s.data.every(v => v == null)) ? (
          <EmptyState icon="📊" title="No data yet" description="Enter revenue to see labor % trends." />
        ) : (
          <LineChart series={chartData} xLabels={xLabels} threshold={LABOR_WARNING_PCT} height={220} />
        )}
      </div>

      {/* Table — last week */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Last Week Summary (per store)</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {fmtDateShort(weeks[NUM_WEEKS - 1])} – {fmtDateShort(addDays(weeks[NUM_WEEKS - 1], 6))}
          </span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh col="name">Store</SortTh>
                <th>City</th>
                <th>Staff</th>
                <th>Hours</th>
                <SortTh col="cost">Labor Cost</SortTh>
                <SortTh col="rev">Revenue</SortTh>
                <SortTh col="pct">Labor %</SortTh>
              </tr>
            </thead>
            <tbody>
              {sortedTable().map(({ store, staff, hrs, cost, rev, pct }) => {
                const high = pct != null && pct > LABOR_WARNING_PCT
                return (
                  <tr key={store.id} className={high ? 'labor-high' : ''}>
                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{store.city}</td>
                    <td>{staff}</td>
                    <td>{hrs.toFixed(1)}h</td>
                    <td>€{cost.toFixed(0)}</td>
                    <td>{rev > 0 ? `€${rev.toFixed(0)}` : <span style={{ color: 'var(--text-subtle)' }}>—</span>}</td>
                    <td style={{ fontWeight: high ? 700 : 400, color: high ? 'var(--danger)' : 'inherit' }}>
                      {pct != null ? pct.toFixed(1) + '%' : '—'}{high && ' ⚠'}
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

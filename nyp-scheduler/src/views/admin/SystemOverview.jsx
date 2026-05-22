import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { STORES } from '../../constants.js'
import Avatar from '../../components/shared/Avatar.jsx'

export default function SystemOverview() {
  const [employees, setEmployees] = useState([])
  const [lastShift, setLastShift] = useState({})
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true)
      setEmployees(emps || [])

      // Last scheduled date per employee
      const { data: shifts } = await supabase
        .from('shifts')
        .select('employee_id, date')
        .order('date', { ascending: false })

      const byEmp = {}
      ;(shifts || []).forEach(s => {
        if (!byEmp[s.employee_id]) byEmp[s.employee_id] = s.date
      })
      setLastShift(byEmp)
      setLoading(false)
    }
    load()
  }, [])

  const total = employees.length
  const byCity = {}
  STORES.forEach(s => {
    if (!byCity[s.city]) byCity[s.city] = []
    byCity[s.city].push(s)
  })

  const storeStats = STORES.map(s => ({
    store: s,
    count: employees.filter(e => e.store_id === s.id).length,
  }))

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>

  return (
    <div>
      {/* Top metrics */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-label">Total Active Staff</div>
          <div className="metric-value">{total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Stores</div>
          <div className="metric-value">{STORES.length}</div>
        </div>
        {Object.entries(byCity).map(([city, stores]) => (
          <div key={city} className="metric-card">
            <div className="metric-label">{city} stores</div>
            <div className="metric-value">{stores.length}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Staff per Store</div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>City</th>
                <th>Active Staff</th>
                <th>Employees</th>
              </tr>
            </thead>
            <tbody>
              {storeStats.map(({ store, count }) => {
                const storeEmps = employees.filter(e => e.store_id === store.id)
                return (
                  <tr key={store.id}>
                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{store.city}</td>
                    <td>
                      <span className={`badge ${count > 0 ? 'badge-green' : 'badge-gray'}`}>{count}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {storeEmps.map(e => (
                          <span key={e.id} title={`${e.first_name} ${e.last_name} · ${e.role} · Last: ${lastShift[e.id] || 'never'}`}>
                            <Avatar firstName={e.first_name} lastName={e.last_name} size="sm" />
                          </span>
                        ))}
                        {count === 0 && <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>No staff</span>}
                      </div>
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

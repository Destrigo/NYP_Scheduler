import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STORES } from '../../constants.js'
import { today, getMonday, addDays, fmtDateShort } from '../../utils.js'
import WeekGrid from '../../components/schedule/WeekGrid.jsx'

export default function ManagerView() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(getMonday(today()))
  const [summary, setSummary]     = useState(null)

  const store = STORES.find(s => s.id === user.store_id)

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{store?.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{store?.city} · Weekly Schedule</p>
        </div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} />
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card">
            <WeekGrid
              storeId={user.store_id}
              weekStart={weekStart}
              readOnly={false}
              onWeekDataChange={setSummary}
            />
          </div>
        </div>

        {/* Week summary panel — desktop only */}
        <div className="week-summary">
          <WeekSummary summary={summary} weekStart={weekStart} />
        </div>
      </div>
    </div>
  )
}

function WeekNav({ weekStart, onChange }) {
  return (
    <div className="week-nav">
      <button className="btn btn-secondary btn-sm" onClick={() => onChange(addDays(weekStart, -7))}>← Prev</button>
      <span className="week-nav-label">
        {fmtDateShort(weekStart)} – {fmtDateShort(addDays(weekStart, 6))}
      </span>
      <button className="btn btn-secondary btn-sm" onClick={() => onChange(addDays(weekStart, 7))}>Next →</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(getMonday(today()))}>Today</button>
    </div>
  )
}

function WeekSummary({ summary, weekStart }) {
  if (!summary) return (
    <div className="card" style={{ padding: 16 }}>
      <div className="loading-center" style={{ padding: 24 }}><div className="loading-spinner" /></div>
    </div>
  )

  const { totalHrs, totalCost, warns, staffCount } = summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="card card-sm">
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
          Week Summary
        </div>
        <SummaryRow label="Staff" value={staffCount} />
        <SummaryRow label="Total hours" value={`${totalHrs.toFixed(1)}h`} />
        <SummaryRow label="Est. cost" value={`€${totalCost.toFixed(0)}`} highlight />
      </div>

      {warns.length > 0 && (
        <div className="card card-sm" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning-text)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
            ⚠ Warnings ({warns.length})
          </div>
          {warns.map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--warning-text)', marginBottom: 4, lineHeight: 1.4 }}>
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: highlight ? 700 : 600 }}>{value}</span>
    </div>
  )
}

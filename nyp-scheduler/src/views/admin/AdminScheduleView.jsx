import { useState } from 'react'
import { STORES } from '../../constants.js'
import { today, getMonday, addDays, fmtDateShort } from '../../utils.js'
import WeekGrid from '../../components/schedule/WeekGrid.jsx'

export default function AdminScheduleView() {
  const [storeId,   setStoreId]   = useState(1)
  const [weekStart, setWeekStart] = useState(getMonday(today()))

  const store = STORES.find(s => s.id === storeId)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select
          className="form-input"
          value={storeId}
          onChange={e => setStoreId(Number(e.target.value))}
          style={{ width: 'auto', minWidth: 200 }}
        >
          {STORES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
        </select>

        <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Prev</button>
        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 180, textAlign: 'center' }}>
          {fmtDateShort(weekStart)} – {fmtDateShort(addDays(weekStart, 6))}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next →</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(getMonday(today()))}>Today</button>
      </div>

      <div className="card">
        <WeekGrid storeId={storeId} weekStart={weekStart} readOnly={false} />
      </div>
    </div>
  )
}

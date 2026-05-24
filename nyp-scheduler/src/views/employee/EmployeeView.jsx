import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STORES } from '../../constants.js'
import { today, getMonday, addDays, weekDays, isToday, workedHours, fmtDateShort } from '../../utils.js'
import EmptyState from '../../components/shared/EmptyState.jsx'

export default function EmployeeView() {
  const { user } = useAuth()
  const [tab,       setTab]       = useState('schedule')
  const [shifts,    setShifts]    = useState([])
  const [manager,   setManager]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)

  const store = STORES.find(s => s.id === user.store_id)
  const thisWeek = getMonday(today())
  const nextWeek = addDays(thisWeek, 7)
  const twoWeeks = [thisWeek, nextWeek]

  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)
      // Only show published weeks
      const { data: pubWeeks } = await supabase
        .from('week_schedules')
        .select('week_start_date')
        .eq('store_id', user.store_id)
        .eq('status', 'published')

      const pubSet = new Set((pubWeeks || []).map(w => w.week_start_date))

      // Fetch from start of current month so monthHrs is computed on full-month data
      const from = monthStart < thisWeek ? monthStart : thisWeek
      const to   = addDays(nextWeek, 6)

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date')

      if (error) { setLoadError(error.message); setLoading(false); return }
      setShifts((data || []).filter(s => pubSet.has(getMonday(s.date))))

      const { data: mgr } = await supabase
        .from('employees')
        .select('first_name, last_name, phone')
        .eq('store_id', user.store_id)
        .eq('user_role', 'store_manager')
        .maybeSingle()
      setManager(mgr)
      setLoading(false)
    }
    load()
  }, [user.id, user.store_id])

  // Hours — monthStart/monthEnd defined above alongside the fetch range
  const weekHrs  = shifts.filter(s => s.date >= thisWeek && s.date <= addDays(thisWeek, 6))
    .reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
  const monthHrs = shifts.filter(s => s.date >= monthStart && s.date <= monthEnd)
    .reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
  const contractWeek  = user.contract_hours_per_week || 0
  const contractMonth = Math.round(contractWeek * 52 / 12)

  if (loading)   return <div className="loading-center"><div className="loading-spinner" /></div>
  if (loadError) return <div className="alert alert-error" style={{ margin: 20 }}>Failed to load schedule: {loadError}</div>

  return (
    <div>
      <div className="page-header">
        <h1>My Schedule</h1>
        <p>Welcome back, {user.first_name} · {store?.name}</p>
      </div>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${tab === 'schedule' ? ' active' : ''}`} onClick={() => setTab('schedule')}>Schedule</button>
        <button className={`tab-btn${tab === 'hours' ? ' active' : ''}`} onClick={() => setTab('hours')}>My Hours</button>
      </div>

      {tab === 'schedule' && (
        <div>
          {twoWeeks.map(wk => (
            <WeekCard key={wk} weekStart={wk} shifts={shifts} />
          ))}

          {manager && (
            <div className="card card-sm" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Store Manager</div>
              <div style={{ fontWeight: 600 }}>{manager.first_name} {manager.last_name}</div>
              {manager.phone && (
                <a
                  href={`https://wa.me/${manager.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: 'var(--primary)' }}
                >
                  WhatsApp: {manager.phone}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'hours' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HoursCard label="This week" scheduled={weekHrs} contract={contractWeek} />
          <HoursCard label="This month" scheduled={monthHrs} contract={contractMonth} />
          <div className="card card-sm">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Contract</div>
            <div style={{ fontWeight: 600 }}>{contractWeek}h / week · {user.contract_type} · €{user.hourly_rate}/h</div>
          </div>
        </div>
      )}
    </div>
  )
}

function WeekCard({ weekStart, shifts }) {
  const days = weekDays(weekStart)
  const label = `${fmtDateShort(weekStart)} – ${fmtDateShort(days[6])}`
  const hasAny = days.some(d => shifts.find(s => s.date === d))

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>{label}</div>
      {!hasAny && (
        <EmptyState icon="📭" title="Not published yet" description="Your manager hasn't published this week's schedule." />
      )}
      <div className="schedule-week">
        {days.map(d => {
          const shift = shifts.find(s => s.date === d)
          const todayDay = isToday(d)
          return (
            <div key={d} className={`schedule-day-card${todayDay ? ' today' : ''}${!shift ? ' off' : ''}`}>
              <div className="schedule-day-label">
                <div className="schedule-day-name">
                  {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}
                  {todayDay && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, marginLeft: 6 }}>TODAY</span>}
                </div>
                <div className="schedule-day-date">
                  {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              {shift ? (
                <div style={{ flex: 1 }}>
                  <span className={`shift-chip ${shift.role}`} style={{ display: 'inline-block' }}>
                    {shift.start_time?.slice(0,5)}–{shift.end_time?.slice(0,5)} · {workedHours(shift.start_time, shift.end_time, shift.break_minutes).toFixed(1)}h
                  </span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Day off</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HoursCard({ label, scheduled, contract }) {
  const pct  = contract > 0 ? scheduled / contract : 0
  const over = pct > 1
  return (
    <div className="card card-sm">
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1 }}>{scheduled.toFixed(1)}h</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {contract}h</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill${over ? ' over' : pct > 0.85 ? ' warn' : ''}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
      {over && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 5, fontWeight: 500 }}>
          {(scheduled - contract).toFixed(1)}h over contract
        </div>
      )}
    </div>
  )
}

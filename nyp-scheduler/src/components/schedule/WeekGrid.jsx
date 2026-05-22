import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { useConfirm } from '../../contexts/ConfirmContext.jsx'
import { weekDays, addDays, isToday, workedHours, checkMinorViolation } from '../../utils.js'
import ShiftChip from './ShiftChip.jsx'
import ShiftModal from './ShiftModal.jsx'
import EmptyState from '../shared/EmptyState.jsx'

export default function WeekGrid({ storeId, weekStart, readOnly = false, onWeekDataChange }) {
  const toast   = useToast()
  const confirm = useConfirm()

  const [employees,   setEmployees]   = useState([])
  const [shifts,      setShifts]      = useState([])
  const [weekStatus,  setWeekStatus]  = useState('draft')
  const [storeSettings, setStoreSettings] = useState({ opening_time: '11:00', closing_time: '23:00' })
  const [loading,     setLoading]     = useState(true)
  const [dragShift,   setDragShift]   = useState(null)
  const [dragOver,    setDragOver]    = useState(null)
  const [modal,       setModal]       = useState(null)

  const days    = weekDays(weekStart)
  const weekEnd = days[6]

  const load = useCallback(async () => {
    setLoading(true)
    const [empsRes, shiftsRes, statusRes, storeRes] = await Promise.all([
      supabase.from('employees').select('*').eq('store_id', storeId).eq('is_active', true).order('first_name'),
      supabase.from('shifts').select('*').eq('store_id', storeId).gte('date', weekStart).lte('date', weekEnd),
      supabase.from('week_schedules').select('*').eq('store_id', storeId).eq('week_start_date', weekStart).maybeSingle(),
      supabase.from('stores').select('opening_time,closing_time').eq('id', storeId).maybeSingle(),
    ])
    setEmployees(empsRes.data || [])
    setShifts(shiftsRes.data || [])
    setWeekStatus(statusRes.data?.status || 'draft')
    if (storeRes.data) setStoreSettings(storeRes.data)
    setLoading(false)
  }, [storeId, weekStart])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!loading) onWeekDataChange?.(computeWeekSummary())
  }, [shifts, employees, loading])

  function getShiftsForCell(empId, date) {
    return shifts.filter(s => s.employee_id === empId && s.date === date)
  }

  function getCellWarnings(emp, date) {
    const dayShifts = getShiftsForCell(emp.id, date)
    const warns = []
    dayShifts.forEach(s => {
      const minor = checkMinorViolation(emp, s.end_time)
      if (minor) warns.push('Minor hours')
    })
    const weekHrs = shifts.filter(s => s.employee_id === emp.id)
      .reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
    if (weekHrs > emp.contract_hours_per_week && emp.contract_hours_per_week > 0) warns.push('Over contract')
    return warns
  }

  function getDayTotals(date) {
    const dayShifts = shifts.filter(s => s.date === date)
    const staffSet  = new Set(dayShifts.map(s => s.employee_id))
    const hours     = dayShifts.reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
    const cost      = dayShifts.reduce((a, s) => {
      const emp = employees.find(e => e.id === s.employee_id)
      return a + (emp ? workedHours(s.start_time, s.end_time, s.break_minutes) * emp.hourly_rate : 0)
    }, 0)
    const hasManager = dayShifts.some(s => s.role === 'Manager')
    return { staffCount: staffSet.size, hours, cost, hasManager, hasShifts: dayShifts.length > 0 }
  }

  function getEmpWeekStats(emp) {
    const empShifts = shifts.filter(s => s.employee_id === emp.id)
    const hrs = empShifts.reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
    const pct = emp.contract_hours_per_week > 0 ? hrs / emp.contract_hours_per_week : 0
    return { hrs, pct }
  }

  function computeWeekSummary() {
    const totalHrs  = shifts.reduce((a, s) => a + workedHours(s.start_time, s.end_time, s.break_minutes), 0)
    const totalCost = shifts.reduce((a, s) => {
      const emp = employees.find(e => e.id === s.employee_id)
      return a + (emp ? workedHours(s.start_time, s.end_time, s.break_minutes) * emp.hourly_rate : 0)
    }, 0)
    const warns = []
    days.forEach(d => {
      const t = getDayTotals(d)
      if (t.hasShifts && !t.hasManager) warns.push(`No manager on ${new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}`)
    })
    employees.forEach(emp => {
      const { hrs } = getEmpWeekStats(emp)
      if (hrs > emp.contract_hours_per_week && emp.contract_hours_per_week > 0)
        warns.push(`${emp.first_name} ${hrs.toFixed(1)}h > ${emp.contract_hours_per_week}h contract`)
    })
    return { totalHrs, totalCost, warns, staffCount: employees.length }
  }

  async function togglePublish() {
    const newStatus = weekStatus === 'draft' ? 'published' : 'draft'
    const { error } = await supabase.from('week_schedules').upsert({
      store_id: storeId, week_start_date: weekStart, status: newStatus,
    }, { onConflict: 'store_id,week_start_date' })
    if (error) { toast('Failed to update status', 'error'); return }
    setWeekStatus(newStatus)
    toast(newStatus === 'published' ? 'Week published — visible to employees' : 'Week unpublished')
  }

  async function copyPrevWeek() {
    const ok = await confirm('Copy previous week\'s schedule to this week? Existing shifts are kept.', { confirmLabel: 'Copy' })
    if (!ok) return
    const prevStart = addDays(weekStart, -7)
    const prevEnd   = addDays(prevStart, 6)
    const { data: prevShifts } = await supabase.from('shifts').select('*').eq('store_id', storeId).gte('date', prevStart).lte('date', prevEnd)
    if (!prevShifts?.length) { toast('No shifts found in the previous week', 'warn'); return }
    const toInsert = prevShifts.map(s => {
      const dayOffset = Math.round((new Date(s.date) - new Date(prevStart)) / 86400000)
      const newDate   = addDays(weekStart, dayOffset)
      const exists    = shifts.find(x => x.employee_id === s.employee_id && x.date === newDate)
      if (exists) return null
      const { id, created_at, ...rest } = s
      return { ...rest, date: newDate }
    }).filter(Boolean)
    if (!toInsert.length) { toast('All shifts already exist in this week', 'warn'); return }
    const { error } = await supabase.from('shifts').insert(toInsert)
    if (error) { toast('Copy failed: ' + error.message, 'error'); return }
    toast(`Copied ${toInsert.length} shifts`)
    load()
  }

  async function handleDrop(emp, date) {
    if (!dragShift) return
    setDragOver(null)

    const existingOnDay = getShiftsForCell(emp.id, date)
    const newS = workedHours(dragShift.start_time, dragShift.end_time)
    const minorWarn = checkMinorViolation(emp, dragShift.end_time)
    if (minorWarn) { toast(minorWarn + ' — cannot copy.', 'error'); setDragShift(null); return }
    if (existingOnDay.length > 0) { toast(`${emp.first_name} already has a shift on this day`, 'error'); setDragShift(null); return }

    const { id, created_at, ...rest } = dragShift
    const { error } = await supabase.from('shifts').insert({
      ...rest, employee_id: emp.id, store_id: storeId, date,
    })
    if (error) { toast('Copy failed', 'error') } else { toast('Shift copied'); load() }
    setDragShift(null)
  }

  if (loading) return <div className="loading-center"><div className="loading-spinner" /> Loading schedule…</div>

  return (
    <div>
      {/* Controls */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge ${weekStatus === 'published' ? 'badge-green' : 'badge-yellow'}`}>
            {weekStatus === 'published' ? '✓ Published' : '✎ Draft'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={copyPrevWeek}>Copy prev week</button>
          <button
            className={`btn btn-sm ${weekStatus === 'draft' ? 'btn-success' : 'btn-secondary'}`}
            onClick={togglePublish}
          >
            {weekStatus === 'draft' ? 'Publish' : 'Unpublish'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Print</button>
        </div>
      )}

      {employees.length === 0 ? (
        <EmptyState icon="👥" title="No employees assigned" description="Add employees to this store to start scheduling." />
      ) : (
        <div className="week-grid-wrap">
          <table className="week-grid">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 155 }}>Employee</th>
                {days.map(d => (
                  <th key={d} className={isToday(d) ? 'col-today' : ''}>
                    <div>{new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>
                      {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const { hrs, pct } = getEmpWeekStats(emp)
                const over = pct > 1
                return (
                  <tr key={emp.id}>
                    <td className="emp-col">
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.first_name} {emp.last_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.role}</div>
                      <div className="emp-util-bar" style={{ marginTop: 5 }}>
                        <div
                          className={`emp-util-fill${over ? ' over' : ''}`}
                          style={{ width: `${Math.min(pct * 100, 100)}%` }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: over ? 'var(--danger)' : 'var(--text-subtle)', marginTop: 2 }}>
                        {hrs.toFixed(1)}h / {emp.contract_hours_per_week}h
                      </div>
                    </td>
                    {days.map(d => {
                      const cellShifts = getShiftsForCell(emp.id, d)
                      const warns      = getCellWarnings(emp, d)
                      const isDragTarget = dragOver?.empId === emp.id && dragOver?.date === d
                      return (
                        <td
                          key={d}
                          className={`day-cell${isToday(d) ? ' col-today' : ''}${isDragTarget ? ' drag-over' : ''}`}
                          onClick={() => !readOnly && setModal({ emp, date: d, shift: null })}
                          onDragOver={e => { if (dragShift) { e.preventDefault(); setDragOver({ empId: emp.id, date: d }) } }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={() => handleDrop(emp, d)}
                        >
                          {cellShifts.map(s => (
                            <ShiftChip
                              key={s.id}
                              shift={s}
                              isDragging={dragShift?.id === s.id}
                              onClick={sh => !readOnly && setModal({ emp, date: d, shift: sh })}
                              onDragStart={sh => setDragShift(sh)}
                              onDragEnd={() => { /* keep dragShift until drop */ }}
                            />
                          ))}
                          {cellShifts.length === 0 && !readOnly && (
                            <div className="shift-add-btn">+</div>
                          )}
                          {warns.map((w, i) => (
                            <span key={i} className="warn-badge">⚠ {w}</span>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Totals row */}
              <tr className="totals-row">
                <td style={{ fontWeight: 700 }}>Totals</td>
                {days.map(d => {
                  const { staffCount, hours, cost, hasManager, hasShifts } = getDayTotals(d)
                  return (
                    <td key={d}>
                      <div>{staffCount} staff</div>
                      <div>{hours.toFixed(1)}h</div>
                      <div>€{cost.toFixed(0)}</div>
                      {hasShifts && !hasManager && (
                        <span className="warn-badge">⚠ No mgr</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ShiftModal
          shift={modal.shift}
          prefillDate={modal.date}
          prefillEmployee={modal.emp}
          storeId={storeId}
          storeSettings={storeSettings}
          employees={employees}
          onSave={() => { setModal(null); load() }}
          onDelete={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

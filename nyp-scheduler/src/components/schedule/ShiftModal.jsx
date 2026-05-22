import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { useConfirm } from '../../contexts/ConfirmContext.jsx'
import { SHIFT_ROLES } from '../../constants.js'
import { timeToMin, workedHours, checkMinorViolation } from '../../utils.js'
import FormGroup from '../shared/FormGroup.jsx'

export default function ShiftModal({ shift, prefillDate, prefillEmployee, storeId, storeSettings, employees, onSave, onDelete, onClose }) {
  const toast = useToast()
  const confirm = useConfirm()

  const [empId, setEmpId]     = useState(shift?.employee_id || prefillEmployee?.id || '')
  const [role, setRole]       = useState(shift?.role || prefillEmployee?.role || 'PizzaMaker')
  const [date, setDate]       = useState(shift?.date || prefillDate || '')
  const [shiftType, setShiftType] = useState('custom')
  const [start, setStart]     = useState(shift?.start_time?.slice(0,5) || '12:00')
  const [end, setEnd]         = useState(shift?.end_time?.slice(0,5) || '18:00')
  const [brk, setBrk]         = useState(shift?.break_minutes ?? 0)
  const [minorWarn, setMinorWarn] = useState('')
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  const opening = storeSettings?.opening_time?.slice(0,5) || '11:00'
  const closing = storeSettings?.closing_time?.slice(0,5) || '23:00'

  useEffect(() => {
    if (shiftType === 'full')    { setStart(opening); setEnd(closing) }
    if (shiftType === 'opening') setStart(opening)
    if (shiftType === 'closing') setEnd(closing)
  }, [shiftType])

  useEffect(() => {
    const emp = employees.find(e => e.id === empId)
    setMinorWarn(checkMinorViolation(emp, end) || '')
  }, [empId, end])

  function validate() {
    const errs = {}
    if (!empId) errs.empId = 'Select an employee'
    if (!date)  errs.date  = 'Select a date'
    if (!start) errs.start = 'Required'
    if (!end)   errs.end   = 'Required'
    if (start && end && timeToMin(end) <= timeToMin(start)) errs.end = 'Must be after start'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    if (minorWarn) { toast(minorWarn + ' — shift blocked.', 'error'); return }

    setSaving(true)

    // Double-booking check
    const { data: existing } = await supabase
      .from('shifts')
      .select('id, start_time, end_time')
      .eq('employee_id', empId)
      .eq('date', date)
      .neq('id', shift?.id ?? '00000000-0000-0000-0000-000000000000')

    const newS = timeToMin(start), newE = timeToMin(end)
    const overlap = (existing || []).find(s => {
      const ss = timeToMin(s.start_time), se = timeToMin(s.end_time)
      return newS < se && newE > ss
    })
    if (overlap) {
      toast('Employee already has an overlapping shift on this day.', 'error')
      setSaving(false)
      return
    }

    const payload = {
      employee_id: empId, store_id: storeId, date,
      start_time: start, end_time: end,
      break_minutes: Number(brk), role,
    }

    let err
    if (shift?.id) {
      ({ error: err } = await supabase.from('shifts').update(payload).eq('id', shift.id))
    } else {
      ({ error: err } = await supabase.from('shifts').insert(payload))
    }

    setSaving(false)
    if (err) { toast('Failed to save shift: ' + err.message, 'error'); return }
    toast(shift ? 'Shift updated' : 'Shift added')
    onSave()
  }

  async function handleDelete() {
    const ok = await confirm('Delete this shift?', { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    const { error } = await supabase.from('shifts').delete().eq('id', shift.id)
    if (error) { toast('Delete failed', 'error'); return }
    toast('Shift deleted')
    onDelete()
  }

  const emp = employees.find(e => e.id === empId)
  const hours = workedHours(start, end, Number(brk))
  const cost  = emp ? hours * emp.hourly_rate : 0

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{shift ? 'Edit Shift' : 'Add Shift'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {minorWarn && <div className="alert alert-error">{minorWarn}</div>}

          <FormGroup label="Employee" required error={errors.empId}>
            <select className="form-input" value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">— select employee —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.role})</option>
              ))}
            </select>
          </FormGroup>

          <div className="form-row form-row-2">
            <FormGroup label="Date" required error={errors.date}>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </FormGroup>
            <FormGroup label="Role">
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                {SHIFT_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </FormGroup>
          </div>

          <FormGroup label="Shift type">
            <select className="form-input" value={shiftType} onChange={e => setShiftType(e.target.value)}>
              <option value="custom">Custom hours</option>
              <option value="opening">Opening shift (start = store open)</option>
              <option value="closing">Closing shift (end = store close)</option>
              <option value="full">Full day (open → close)</option>
            </select>
          </FormGroup>

          <div className="form-row form-row-3">
            <FormGroup label="Start" error={errors.start}>
              <input className="form-input" type="time" value={start}
                onChange={e => setStart(e.target.value)}
                disabled={shiftType === 'opening' || shiftType === 'full'} />
            </FormGroup>
            <FormGroup label="End" error={errors.end}>
              <input className="form-input" type="time" value={end}
                onChange={e => setEnd(e.target.value)}
                disabled={shiftType === 'closing' || shiftType === 'full'} />
            </FormGroup>
            <FormGroup label="Break (min)">
              <input className="form-input" type="number" value={brk}
                onChange={e => setBrk(e.target.value)} min={0} max={120} />
            </FormGroup>
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, border: '1px solid var(--border)' }}>
            <strong>{hours.toFixed(1)}h</strong> worked ·{' '}
            Cost: <strong>€{cost.toFixed(2)}</strong>
            {emp && <span style={{ color: 'var(--text-muted)' }}> (€{emp.hourly_rate}/h)</span>}
          </div>
        </div>
        <div className="modal-footer">
          {shift && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
              Delete
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !!minorWarn}>
            {saving ? 'Saving…' : shift ? 'Update' : 'Add Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../../supabase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import { STORES } from '../../constants.js'
import { today, addDays } from '../../utils.js'
import FormGroup from '../../components/shared/FormGroup.jsx'

export default function RevenueInput() {
  const { user }  = useAuth()
  const toast     = useToast()
  const [bulk,    setBulk]    = useState(false)
  const [date,    setDate]    = useState(addDays(today(), -1))
  const [storeId, setStoreId] = useState('')
  const [amount,  setAmount]  = useState('')
  const [bulkAmts, setBulkAmts] = useState({})
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  async function upsertRevenue(sid, d, amt) {
    if (!amt || isNaN(Number(amt)) || Number(amt) < 0) return
    return supabase.from('daily_revenues').upsert({
      store_id: Number(sid), date: d, revenue_amount: Number(amt), entered_by: user.id,
    }, { onConflict: 'store_id,date' })
  }

  async function handleSingle(e) {
    e.preventDefault()
    const errs = {}
    if (!storeId) errs.storeId = 'Select a store'
    if (!amount || isNaN(Number(amount))) errs.amount = 'Enter a valid amount'
    if (date > today()) errs.date = 'Cannot enter future revenue'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const { error } = await upsertRevenue(storeId, date, amount)
    setSaving(false)
    if (error) { toast('Save failed: ' + error.message, 'error'); return }
    toast('Revenue saved')
    setAmount('')
  }

  async function handleBulk(e) {
    e.preventDefault()
    if (date > today()) { toast('Cannot enter future revenue', 'error'); return }
    const entries = Object.entries(bulkAmts).filter(([, v]) => v !== '' && !isNaN(Number(v)))
    if (!entries.length) { toast('Enter at least one amount', 'warn'); return }
    setSaving(true)
    await Promise.all(entries.map(([sid, amt]) => upsertRevenue(sid, date, amt)))
    setSaving(false)
    toast(`Saved ${entries.length} store${entries.length > 1 ? 's' : ''}`)
    setBulkAmts({})
  }

  return (
    <div>
      <div className="page-header">
        <h1>Revenue Input</h1>
        <p>Record daily revenue per store</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="checkbox-label">
            <input type="checkbox" checked={bulk} onChange={e => setBulk(e.target.checked)} />
            Bulk mode — enter all stores at once
          </label>
        </div>

        <FormGroup label="Date" error={errors.date}>
          <input className="form-input" type="date" value={date} max={today()}
            onChange={e => setDate(e.target.value)} style={{ maxWidth: 200 }} />
        </FormGroup>

        {!bulk ? (
          <form onSubmit={handleSingle}>
            <FormGroup label="Store" required error={errors.storeId}>
              <select className="form-input" value={storeId} onChange={e => setStoreId(e.target.value)} style={{ maxWidth: 320 }}>
                <option value="">— select store —</option>
                {STORES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Revenue (€)" required error={errors.amount}>
              <input className="form-input" type="number" value={amount}
                onChange={e => setAmount(e.target.value)} min={0} step={0.01}
                placeholder="0.00" style={{ maxWidth: 200 }} />
            </FormGroup>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Revenue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulk}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10, marginBottom: 16 }}>
              {STORES.map(s => (
                <FormGroup key={s.id} label={s.name} style={{ margin: 0 }}>
                  <input
                    className="form-input"
                    type="number"
                    value={bulkAmts[s.id] || ''}
                    onChange={e => setBulkAmts(p => ({ ...p, [s.id]: e.target.value }))}
                    placeholder="€ 0.00"
                    min={0}
                    step={0.01}
                  />
                </FormGroup>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : `Save All Stores`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../../supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { STORES } from '../../constants.js'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_NUMS = [1,2,3,4,5,6,0]

export default function StoreManagement() {
  const toast = useToast()
  const [selected, setSelected] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  async function openStore(store) {
    setSelected(store)
    setLoading(true)
    const { data } = await supabase.from('stores').select('*').eq('id', store.id).maybeSingle()
    setSettings(data || {
      id: store.id,
      opening_time: '11:00',
      closing_time: '23:00',
      operating_days: [0,1,2,3,4,5,6],
    })
    setLoading(false)
  }

  function set(k, v) { setSettings(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('stores').upsert(settings, { onConflict: 'id' })
    setSaving(false)
    if (error) { toast('Save failed: ' + error.message, 'error'); return }
    toast('Store settings saved')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Store list */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, padding: '4px 6px', marginBottom: 6, color: 'var(--text-muted)' }}>
          {STORES.length} Stores
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 520, overflowY: 'auto' }}>
          {STORES.map(s => (
            <button
              key={s.id}
              onClick={() => openStore(s)}
              style={{
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                background: selected?.id === s.id ? 'var(--primary-light)' : 'transparent',
                border: selected?.id === s.id ? '1px solid var(--primary)' : '1px solid transparent',
                fontWeight: selected?.id === s.id ? 600 : 400, fontSize: 13,
                color: selected?.id === s.id ? 'var(--primary-dark)' : 'var(--text)',
              }}
            >
              <div>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.city}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings panel */}
      {!selected ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
          ← Select a store to edit settings
        </div>
      ) : loading ? (
        <div className="card loading-center"><div className="loading-spinner" /></div>
      ) : settings && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{selected.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.city}</div>
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Opening Time</label>
              <input className="form-input" type="time" value={settings.opening_time || '11:00'} onChange={e => set('opening_time', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Time</label>
              <input className="form-input" type="time" value={settings.closing_time || '23:00'} onChange={e => set('closing_time', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Operating Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {DAYS.map((d, i) => {
                const num = DAY_NUMS[i]
                const checked = (settings.operating_days || []).includes(num)
                return (
                  <label key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      style={{ accentColor: 'var(--primary)' }}
                      onChange={e => {
                        const days = settings.operating_days || []
                        set('operating_days', e.target.checked ? [...days, num] : days.filter(x => x !== num))
                      }}
                    />
                    {d}
                  </label>
                )
              })}
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}

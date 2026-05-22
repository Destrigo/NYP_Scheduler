import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { useConfirm } from '../../contexts/ConfirmContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STORES, SHIFT_ROLES, USER_ROLES, CONTRACT_TYPES, USER_ROLE_LABELS, ROLE_COLORS } from '../../constants.js'
import Avatar from '../../components/shared/Avatar.jsx'
import FormGroup from '../../components/shared/FormGroup.jsx'
import EmptyState from '../../components/shared/EmptyState.jsx'

export default function UserManagement() {
  const toast   = useToast()
  const confirm = useConfirm()
  const { refreshUser } = useAuth()

  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStore, setFilterStore] = useState('all')
  const [sortCol,   setSortCol]   = useState('first_name')
  const [sortDir,   setSortDir]   = useState(1)
  const [modal,     setModal]     = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('first_name')
    setEmployees(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(emp) {
    const { id, ...payload } = emp
    let error
    if (id) {
      ({ error } = await supabase.from('employees').update(payload).eq('id', id))
    } else {
      ({ error } = await supabase.from('employees').insert(payload))
    }
    if (error) { toast('Save failed: ' + error.message, 'error'); return }
    toast(id ? 'Employee updated' : 'Employee added')
    load()
    refreshUser()
    setModal(null)
  }

  async function handleDeactivate(emp) {
    const ok = await confirm(`Deactivate ${emp.first_name} ${emp.last_name}?`, { confirmLabel: 'Deactivate', danger: true })
    if (!ok) return
    await supabase.from('employees').update({ is_active: false }).eq('id', emp.id)
    toast('Employee deactivated')
    load()
  }

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => -d)
    else { setSortCol(col); setSortDir(1) }
  }

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    if (q && !(e.first_name + ' ' + e.last_name + ' ' + e.email).toLowerCase().includes(q)) return false
    if (filterRole  !== 'all' && e.user_role  !== filterRole)   return false
    if (filterStore !== 'all' && e.store_id   !== Number(filterStore)) return false
    return true
  }).sort((a, b) => {
    const av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
    if (av < bv) return -sortDir
    if (av > bv) return  sortDir
    return 0
  })

  const roleBadgeClass = { employee: 'badge-gray', store_manager: 'badge-blue', backoffice: 'badge-purple', superadmin: 'badge-red' }
  const shiftBadgeClass = { Manager: 'badge-blue', PizzaMaker: 'badge-red', Rider: 'badge-green' }

  function SortTh({ col, children }) {
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer' }}>
        {children}{sortCol === col ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <select className="form-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All roles</option>
          {USER_ROLES.map(r => <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>)}
        </select>
        <select className="form-input" value={filterStore} onChange={e => setFilterStore(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All stores</option>
          {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ emp: null })}>+ Add Employee</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="No employees found" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortTh col="first_name">Name</SortTh>
                  <th>Email</th>
                  <th>Store</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Contract</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar firstName={e.first_name} lastName={e.last_name} size="sm" />
                        <span style={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.email}</td>
                    <td style={{ fontSize: 12 }}>{STORES.find(s => s.id === e.store_id)?.name || '—'}</td>
                    <td><span className={`badge ${shiftBadgeClass[e.role] || 'badge-gray'}`}>{e.role}</span></td>
                    <td><span className={`badge ${roleBadgeClass[e.user_role] || 'badge-gray'}`}>{USER_ROLE_LABELS[e.user_role]}</span></td>
                    <td style={{ fontSize: 12 }}>{e.contract_hours_per_week}h · €{e.hourly_rate}/h</td>
                    <td>
                      <span className={`badge ${e.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {e.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => setModal({ emp: e })} style={{ marginRight: 4 }}>Edit</button>
                      {e.is_active && <button className="btn btn-danger btn-xs" onClick={() => handleDeactivate(e)}>Deactivate</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <UserModal emp={modal.emp} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

function UserModal({ emp, onSave, onClose }) {
  const blank = { first_name: '', last_name: '', email: '', password: '', phone: '', date_of_birth: '', role: 'PizzaMaker', contract_type: 'hourly', contract_hours_per_week: 24, hourly_rate: 13, store_id: 1, user_role: 'employee', is_active: true }
  const [form, setForm] = useState(emp ? { ...emp } : blank)
  const [errors, setErrors] = useState({})

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function validate() {
    const errs = {}
    if (!form.first_name) errs.first_name = 'Required'
    if (!form.email)      errs.email      = 'Required'
    if (!form.password)   errs.password   = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      store_id: Number(form.store_id),
      contract_hours_per_week: Number(form.contract_hours_per_week),
      hourly_rate: Number(form.hourly_rate),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{emp ? 'Edit Employee' : 'Add Employee'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form id="user-form" onSubmit={handleSave}>
            <div className="form-row form-row-2">
              <FormGroup label="First Name" required error={errors.first_name}>
                <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </FormGroup>
              <FormGroup label="Last Name">
                <input className="form-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Email" required error={errors.email}>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </FormGroup>
            <FormGroup label="Password" required error={errors.password}>
              <input className="form-input" type="text" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Plain text password" />
            </FormGroup>
            <div className="form-row form-row-2">
              <FormGroup label="Phone (WhatsApp)">
                <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+31612345678" />
              </FormGroup>
              <FormGroup label="Date of Birth">
                <input className="form-input" type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
              </FormGroup>
            </div>
            <div className="form-row form-row-2">
              <FormGroup label="Shift Role">
                <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                  {SHIFT_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="System Role">
                <select className="form-input" value={form.user_role} onChange={e => set('user_role', e.target.value)}>
                  {USER_ROLES.map(r => <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>)}
                </select>
              </FormGroup>
            </div>
            <FormGroup label="Store">
              <select className="form-input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                {STORES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
            </FormGroup>
            <div className="form-row form-row-3">
              <FormGroup label="Contract">
                <select className="form-input" value={form.contract_type} onChange={e => set('contract_type', e.target.value)}>
                  {CONTRACT_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Hours/week">
                <input className="form-input" type="number" value={form.contract_hours_per_week} onChange={e => set('contract_hours_per_week', e.target.value)} min={0} />
              </FormGroup>
              <FormGroup label="€/hour">
                <input className="form-input" type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} min={0} step={0.01} />
              </FormGroup>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
              Active
            </label>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="user-form" type="submit">Save</button>
        </div>
      </div>
    </div>
  )
}

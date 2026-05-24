import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import FormGroup from '../components/shared/FormGroup.jsx'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',    email: 'admin@nyp.nl',      password: 'admin123'   },
  { label: 'Store Manager',  email: 'manager@nyp.nl',    password: 'manager123' },
  { label: 'Back Office',    email: 'backoffice@nyp.nl', password: 'back123'    },
  { label: 'Employee',       email: 'ahmed@nyp.nl',      password: 'emp123'     },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]   = useState('')
  const [pw,    setPw]      = useState('')
  const [err,   setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const error = await login(email, pw)
    setLoading(false)
    if (error) setErr(error)
  }

  async function quickLogin(account) {
    setErr('')
    setLoading(true)
    const error = await login(account.email, account.password)
    setLoading(false)
    if (error) setErr(error)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🍕</div>
          <div className="login-logo-name">NYP</div>
          <div className="login-logo-sub">Shift Scheduler</div>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        <form onSubmit={handleSubmit}>
          <FormGroup label="Email" required>
            <input
              className="form-input"
              type="email"
              value={email}
              autoFocus
              autoComplete="email"
              onChange={e => { setEmail(e.target.value); setErr('') }}
              required
            />
          </FormGroup>
          <FormGroup label="Password" required>
            <input
              className="form-input"
              type="password"
              value={pw}
              autoComplete="current-password"
              onChange={e => { setPw(e.target.value); setErr('') }}
              required
            />
          </FormGroup>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Demo accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                type="button"
                onClick={() => quickLogin(account)}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <span style={{ fontWeight: 600 }}>{account.label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

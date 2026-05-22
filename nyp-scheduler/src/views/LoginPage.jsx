import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import FormGroup from '../components/shared/FormGroup.jsx'

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

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--text)' }}>Demo accounts</strong><br />
          admin@nyp.nl / admin123 — Super Admin<br />
          manager@nyp.nl / manager123 — Store Manager<br />
          backoffice@nyp.nl / back123 — Back Office<br />
          ahmed@nyp.nl / emp123 — Employee
        </div>
      </div>
    </div>
  )
}

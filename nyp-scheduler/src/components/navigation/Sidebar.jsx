import Avatar from '../shared/Avatar.jsx'
import { USER_ROLE_LABELS } from '../../constants.js'

export default function Sidebar({ tabs, active, onChange, user, onLogout }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🍕</span>
        <div>
          <div className="sidebar-logo-text">NYP</div>
          <div className="sidebar-logo-sub">Scheduler</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`sidebar-nav-item${active === t.id ? ' active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />
          <div>
            <div className="sidebar-user-name">{user.first_name} {user.last_name}</div>
            <div className="sidebar-user-role">{USER_ROLE_LABELS[user.user_role] || user.user_role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

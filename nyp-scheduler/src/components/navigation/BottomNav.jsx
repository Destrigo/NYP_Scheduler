export default function BottomNav({ tabs, active, onChange }) {
  return (
    <div className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`bottom-nav-btn${active === t.id ? ' active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.short || t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

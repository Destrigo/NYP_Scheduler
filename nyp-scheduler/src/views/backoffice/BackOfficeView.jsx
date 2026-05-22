import { useState } from 'react'
import Dashboard   from './Dashboard.jsx'
import RevenueInput from './RevenueInput.jsx'
import Reports     from './Reports.jsx'

export default function BackOfficeView({ activeTab: initialTab }) {
  const [tab, setTab] = useState(initialTab || 'dashboard')

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Back Office</h1>
        </div>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          <button className={`tab-btn${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`tab-btn${tab === 'revenue'   ? ' active' : ''}`} onClick={() => setTab('revenue')}>Revenue</button>
          <button className={`tab-btn${tab === 'reports'   ? ' active' : ''}`} onClick={() => setTab('reports')}>Reports</button>
        </div>
      </div>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'revenue'   && <RevenueInput />}
      {tab === 'reports'   && <Reports />}
    </div>
  )
}

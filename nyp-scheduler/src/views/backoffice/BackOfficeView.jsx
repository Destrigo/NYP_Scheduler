import { useState, useEffect } from 'react'
import Dashboard   from './Dashboard.jsx'
import RevenueInput from './RevenueInput.jsx'
import Reports     from './Reports.jsx'

export default function BackOfficeView({ activeTab: initialTab }) {
  const [tab, setTab] = useState(initialTab || 'dashboard')

  // Sync sidebar navigation → internal tab state
  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])

  return (
    <div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'revenue'   && <RevenueInput />}
      {tab === 'reports'   && <Reports />}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ConfirmProvider } from './contexts/ConfirmContext.jsx'
import LoginPage from './views/LoginPage.jsx'
import Sidebar from './components/navigation/Sidebar.jsx'
import BottomNav from './components/navigation/BottomNav.jsx'
import EmployeeView from './views/employee/EmployeeView.jsx'
import ManagerView from './views/manager/ManagerView.jsx'
import BackOfficeView from './views/backoffice/BackOfficeView.jsx'
import AdminView from './views/admin/AdminView.jsx'

function getTabsForRole(role) {
  if (role === 'employee') return [
    { id: 'schedule', label: 'My Schedule', short: 'Schedule', icon: '📅' },
  ]
  if (role === 'store_manager') return [
    { id: 'schedule', label: 'Schedule',    short: 'Schedule', icon: '📅' },
  ]
  if (role === 'backoffice') return [
    { id: 'dashboard', label: 'Dashboard',      short: 'Dashboard', icon: '📊' },
    { id: 'revenue',   label: 'Revenue Input',  short: 'Revenue',   icon: '💰' },
    { id: 'reports',   label: 'Reports',        short: 'Reports',   icon: '📈' },
  ]
  // superadmin
  return [
    { id: 'users',     label: 'Users',          short: 'Users',     icon: '👥' },
    { id: 'stores',    label: 'Stores',         short: 'Stores',    icon: '🏪' },
    { id: 'schedule',  label: 'Schedule View',  short: 'Schedule',  icon: '📅' },
    { id: 'finance',   label: 'Back Office',    short: 'Finance',   icon: '📊' },
    { id: 'overview',  label: 'Overview',       short: 'Overview',  icon: '🏠' },
  ]
}

function AppShell() {
  const { user, logout } = useAuth()
  const tabs = useMemo(() => getTabsForRole(user.user_role), [user.user_role])
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  function renderView() {
    const r = user.user_role
    if (r === 'employee') return <EmployeeView />
    if (r === 'store_manager') return <ManagerView />
    if (r === 'backoffice') return <BackOfficeView activeTab={activeTab} />
    // superadmin
    if (activeTab === 'finance') return <BackOfficeView activeTab="dashboard" />
    return <AdminView activeTab={activeTab} />
  }

  return (
    <div className="app-layout">
      <Sidebar tabs={tabs} active={activeTab} onChange={setActiveTab} user={user} onLogout={logout} />
      <main className="main-content">{renderView()}</main>
      <BottomNav tabs={tabs} active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function App() {
  const { user } = useAuth()
  return user ? <AppShell /> : <LoginPage />
}

export default function Root() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

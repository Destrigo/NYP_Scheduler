import UserManagement    from './UserManagement.jsx'
import StoreManagement   from './StoreManagement.jsx'
import SystemOverview    from './SystemOverview.jsx'
import AdminScheduleView from './AdminScheduleView.jsx'

export default function AdminView({ activeTab }) {
  const titles = {
    users:    { title: 'User Management',    sub: 'Add, edit, and deactivate employees' },
    stores:   { title: 'Store Management',   sub: 'Configure store hours and operating days' },
    overview: { title: 'System Overview',    sub: 'Active staff per store' },
    schedule: { title: 'Schedule View',      sub: 'View and edit any store\'s schedule' },
  }
  const { title, sub } = titles[activeTab] || {}

  return (
    <div>
      {title && (
        <div className="page-header">
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      )}
      {activeTab === 'users'    && <UserManagement />}
      {activeTab === 'stores'   && <StoreManagement />}
      {activeTab === 'overview' && <SystemOverview />}
      {activeTab === 'schedule' && <AdminScheduleView />}
    </div>
  )
}

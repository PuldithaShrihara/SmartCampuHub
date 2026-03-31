import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  FaCalendar,
  FaChartBar,
  FaCog,
  FaHome,
  FaHourglassHalf,
  FaTicketAlt,
  FaUsers,
  FaBuilding,
} from 'react-icons/fa'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/authApi.js'
import AdminHome from './AdminHome.jsx'
import PendingBookingsPage from './PendingBookingsPage.jsx'
import AllBookingsPage from './AllBookingsPage.jsx'
import ResourcesPage from './ResourcesPage.jsx'
import TicketsPage from './TicketsPage.jsx'
import UsersPage from './UsersPage.jsx'
import StatisticsPage from './StatisticsPage.jsx'
import SettingsPage from './SettingsPage.jsx'
import '../../styles/StudentDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/admin', end: true },
    {
      label: 'Pending Bookings',
      icon: FaHourglassHalf,
      path: '/admin/pending-bookings',
    },
    { label: 'All Bookings', icon: FaCalendar, path: '/admin/all-bookings' },
    { label: 'Resources', icon: FaBuilding, path: '/admin/resources' },
    { label: 'All Tickets', icon: FaTicketAlt, path: '/admin/tickets' },
    { label: 'Users', icon: FaUsers, path: '/admin/users' },
    { label: 'Statistics', icon: FaChartBar, path: '/admin/statistics' },
    { label: 'Settings', icon: FaCog, path: '/admin/settings' },
  ]

  function handleLogout() {
    clearSession()
    logout()
    navigate('/staff/login', { replace: true })
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        menuItems={menuItems}
        userRole="ADMIN"
        userName={user?.fullName}
        onLogout={handleLogout}
      />
      <div className="dashboard-main">
        <Header
          title="Admin Dashboard"
          userName={user?.fullName}
          unreadNotifications={3}
          onNotificationClick={() => navigate('/admin/tickets')}
          onLogout={handleLogout}
        />
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/pending-bookings" element={<PendingBookingsPage />} />
            <Route path="/all-bookings" element={<AllBookingsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

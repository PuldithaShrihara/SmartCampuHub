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
import Sidebar from '../../components/Sidebar.jsx'
import Header from '../../components/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/auth.js'
import AdminHome from '../AdminPages/AdminHome.jsx'
import PendingBookings from '../AdminPages/PendingBookings.jsx'
import AllBookings from '../AdminPages/AllBookings.jsx'
import Resources from '../AdminPages/Resources.jsx'
import Tickets from '../AdminPages/Tickets.jsx'
import Users from '../AdminPages/Users.jsx'
import Statistics from '../AdminPages/Statistics.jsx'
import Settings from '../AdminPages/Settings.jsx'
import '../StudentDashboard.css'

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
            <Route path="/pending-bookings" element={<PendingBookings />} />
            <Route path="/all-bookings" element={<AllBookings />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/users" element={<Users />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

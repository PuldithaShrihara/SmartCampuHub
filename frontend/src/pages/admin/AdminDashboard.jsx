import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  FaCalendar,
  FaChartBar,
  FaCog,
  FaHome,
  FaHourglassHalf,
  FaQrcode,
  FaTicketAlt,
  FaUsers,
  FaBuilding,
} from 'react-icons/fa'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/authApi.js'
import AdminHome from './AdminHome.jsx'
import AllBookingsPage from './AllBookingsPage.jsx'
import ResourcesPage from './ResourcesPage.jsx'
import TicketsPage from './TicketsPage.jsx'
import UsersPage from './UsersPage.jsx'
import Notifications from './Notifications.jsx'
import StatisticsPage from './StatisticsPage.jsx'
import SettingsPage from './SettingsPage.jsx'
import VenueAnalysisPage from './VenueAnalysisPage.jsx'
import ScanQrPage from './ScanQrPage.jsx'
import { getUnreadNotificationCount } from '../../api/notifications.js'
import '../../styles/StudentDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const previousUnreadRef = useRef(0)

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/admin', end: true },
    { label: 'All Bookings', icon: FaCalendar, path: '/admin/all-bookings' },
    { label: 'Resources', icon: FaBuilding, path: '/admin/resources' },
    { label: 'All Tickets', icon: FaTicketAlt, path: '/admin/tickets' },
    { label: 'Users', icon: FaUsers, path: '/admin/users' },
    { label: 'Statistics', icon: FaChartBar, path: '/admin/statistics' },
    { label: 'Scan QR', icon: FaQrcode, path: '/admin/scan-qr' },
    { label: 'Settings', icon: FaCog, path: '/admin/settings' },
  ]

  function handleLogout() {
    clearSession()
    logout()
    navigate('/staff/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    async function loadUnread() {
      try {
        const res = await getUnreadNotificationCount()
        const count = res?.count || 0
        if (!cancelled) {
          setUnreadNotifications(count)
          previousUnreadRef.current = count
        }
      } catch {
        if (!cancelled) setUnreadNotifications(0)
      }
    }
    loadUnread()
    const intervalId = window.setInterval(loadUnread, 15000)
    window.addEventListener('notifications:changed', loadUnread)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('notifications:changed', loadUnread)
    }
  }, [])

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
          userRole={user?.role || 'ADMIN'}
          unreadNotifications={unreadNotifications}
          onNotificationClick={() => navigate('/admin/notifications')}
          onLogout={handleLogout}
        />
        <div className="dashboard-content">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="all-bookings" element={<AllBookingsPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="scan-qr" element={<ScanQrPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="analysis/:venueId" element={<VenueAnalysisPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

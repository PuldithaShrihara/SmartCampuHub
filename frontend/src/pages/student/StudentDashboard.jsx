import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FaBell,
  FaBuilding,
  FaCalendar,
  FaCog,
  FaHome,
  FaThLarge,
} from 'react-icons/fa'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/authApi.js'
import { getUnreadNotificationCount } from '../../api/notifications.js'
import StudentHome from './StudentHome.jsx'
import BrowseResourcesPage from './BrowseResourcesPage.jsx'
import MyBookingsPage from './MyBookingsPage.jsx'
import BookingGridViewPage from './BookingGridViewPage.jsx'
import StudentNotificationsPage from './StudentNotificationsPage.jsx'
import StudentSettingsPage from './StudentSettingsPage.jsx'
import '../../styles/StudentDashboard.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/student', end: true },
    { label: 'Browse Resources', icon: FaBuilding, path: '/student/resources' },
    { label: 'My Bookings', icon: FaCalendar, path: '/student/bookings' },
    {
      label: 'Booking Grid View',
      icon: FaThLarge,
      path: '/student/bookings/grid',
    },
    { label: 'Notifications', icon: FaBell, path: '/student/notifications' },
    { label: 'Settings', icon: FaCog, path: '/student/settings' },
  ]

  function handleLogout() {
    clearSession()
    logout()
    navigate('/student/login', { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    async function loadUnread() {
      try {
        const res = await getUnreadNotificationCount()
        if (!cancelled) setUnreadNotifications(res?.count || 0)
      } catch {
        if (!cancelled) setUnreadNotifications(0)
      }
    }
    loadUnread()
    window.addEventListener('notifications:changed', loadUnread)
    return () => {
      cancelled = true
      window.removeEventListener('notifications:changed', loadUnread)
    }
  }, [])

  return (
    <div className="dashboard-container">
      <Sidebar
        menuItems={menuItems}
        userRole="STUDENT"
        userName={user?.fullName}
        onLogout={handleLogout}
      />
      <div className="dashboard-main">
        <Header
          title="Student Dashboard"
          userName={user?.fullName}
          unreadNotifications={unreadNotifications}
          onNotificationClick={() => navigate('/student/notifications')}
          onLogout={handleLogout}
        />
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<StudentHome />} />
            <Route path="/resources" element={<BrowseResourcesPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/bookings/grid" element={<BookingGridViewPage />} />
            <Route
              path="/notifications"
              element={<StudentNotificationsPage />}
            />
            <Route path="/settings" element={<StudentSettingsPage />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FaBell,
  FaBuilding,
  FaCalendar,
  FaCog,
  FaHome,
} from 'react-icons/fa'
import Sidebar from '../../components/Sidebar.jsx'
import Header from '../../components/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/auth.js'
import { getUnreadNotificationCount } from '../../api/notifications.js'
import StudentHome from '../StudentPages/StudentHome.jsx'
import BrowseResources from '../StudentPages/BrowseResources.jsx'
import MyBookings from '../StudentPages/MyBookings.jsx'
import Notifications from '../StudentPages/Notifications.jsx'
import Settings from '../StudentPages/Settings.jsx'
import '../StudentDashboard.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/student', end: true },
    { label: 'Browse Resources', icon: FaBuilding, path: '/student/resources' },
    { label: 'My Bookings', icon: FaCalendar, path: '/student/bookings' },
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
            <Route path="/resources" element={<BrowseResources />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

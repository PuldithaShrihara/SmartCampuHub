import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FaBell,
  FaBuilding,
  FaCalendar,
  FaCog,
  FaHome,
  FaTicketAlt,
} from 'react-icons/fa'
import Sidebar from '../../components/Sidebar.jsx'
import Header from '../../components/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/auth.js'
import { getUnreadNotificationCount } from '../../api/notifications.js'
import TechnicianHome from '../TechnicianPages/TechnicianHome.jsx'
import Tickets from '../TechnicianPages/Tickets.jsx'
import Calendar from '../TechnicianPages/Calendar.jsx'
import Resources from '../TechnicianPages/Resources.jsx'
import Notifications from '../TechnicianPages/Notifications.jsx'
import Settings from '../TechnicianPages/Settings.jsx'
import '../StudentDashboard.css'

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/technician', end: true },
    { label: 'My Tickets', icon: FaTicketAlt, path: '/technician/tickets' },
    {
      label: 'Booking Calendar',
      icon: FaCalendar,
      path: '/technician/calendar',
    },
    {
      label: 'Assigned Resources',
      icon: FaBuilding,
      path: '/technician/resources',
    },
    {
      label: 'Notifications',
      icon: FaBell,
      path: '/technician/notifications',
    },
    { label: 'Settings', icon: FaCog, path: '/technician/settings' },
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
        userRole="TECHNICIAN"
        userName={user?.fullName}
        onLogout={handleLogout}
      />
      <div className="dashboard-main">
        <Header
          title="Technician Dashboard"
          userName={user?.fullName}
          unreadNotifications={unreadNotifications}
          onNotificationClick={() => navigate('/technician/notifications')}
          onLogout={handleLogout}
        />
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<TechnicianHome />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/technician" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  FaBell,
  FaBuilding,
  FaCalendar,
  FaCog,
  FaExclamationTriangle,
  FaHome,
  FaPlus,
  FaThLarge,
} from 'react-icons/fa'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/authApi.js'
import { getUnreadNotificationCount, listNotifications } from '../../api/notifications.js'
import { useToast } from '../../components/toastContext.js'
import StudentHome from './StudentHome.jsx'
import BrowseResourcesPage from './BrowseResourcesPage.jsx'
import CreateBookingPage from './CreateBookingPage.jsx'
import MyBookingsPage from './MyBookingsPage.jsx'
import BookingGridViewPage from './BookingGridViewPage.jsx'
import StudentNotificationsPage from './StudentNotificationsPage.jsx'
import StudentSettingsPage from './StudentSettingsPage.jsx'
import StudentIncidentsPage from './StudentIncidentsPage.jsx'
import '../../styles/StudentDashboard.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { pushToast } = useToast()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const previousUnreadRef = useRef(0)

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/student', end: true },
    { label: 'Browse Resources', icon: FaBuilding, path: '/student/resources' },
    { label: 'My Bookings', icon: FaCalendar, path: '/student/bookings' },
    { label: 'Incidents', icon: FaExclamationTriangle, path: '/student/incidents' },
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
        const count = res?.count || 0
        if (!cancelled) {
          setUnreadNotifications(count)
          if (count > previousUnreadRef.current) {
            try {
              const notifications = await listNotifications()
              const latestUnread = Array.isArray(notifications)
                ? notifications.find((n) => !n?.readAt)
                : null
              if (latestUnread?.message) {
                pushToast({ type: 'success', message: latestUnread.message })
              } else {
                pushToast({ type: 'success', message: 'You have new notifications.' })
              }
            } catch {
              pushToast({ type: 'success', message: 'You have new notifications.' })
            }
          }
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
  }, [pushToast])

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
            <Route path="/bookings/create" element={<CreateBookingPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/bookings/grid" element={<BookingGridViewPage />} />
            <Route path="/incidents" element={<StudentIncidentsPage />} />
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

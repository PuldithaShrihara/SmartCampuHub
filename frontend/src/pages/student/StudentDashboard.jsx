import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  FaBell,
  FaBuilding,
  FaCalendar,
  FaCog,
  FaHome,
  FaPlus,
  FaThLarge,
} from 'react-icons/fa'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import { useAuth } from '../../context/useAuth.js'
import { logout as clearSession } from '../../api/authApi.js'
import StudentHome from './StudentHome.jsx'
import BrowseResourcesPage from './BrowseResourcesPage.jsx'
import CreateBookingPage from './CreateBookingPage.jsx'
import MyBookingsPage from './MyBookingsPage.jsx'
import BookingGridViewPage from './BookingGridViewPage.jsx'
import StudentNotificationsPage from './StudentNotificationsPage.jsx'
import StudentSettingsPage from './StudentSettingsPage.jsx'
import '../../styles/StudentDashboard.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const menuItems = [
    { label: 'Dashboard', icon: FaHome, path: '/student', end: true },
    { label: 'Browse Resources', icon: FaBuilding, path: '/student/resources' },
    {
      label: 'Create Booking',
      icon: FaPlus,
      path: '/student/bookings/create',
    },
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
          unreadNotifications={2}
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

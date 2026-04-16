import { useState, useEffect } from 'react'
import { FaBuilding, FaCalendarCheck, FaUserCheck, FaUsers, FaArrowRight } from 'react-icons/fa'
import { useAuth } from '../../context/useAuth.js'
import { fetchDashboardStats } from '../../api/dashboardApi.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import '../../styles/StudentHome.css' // Reuse the common layout styles

export default function AdminHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalResources: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const statsData = await fetchDashboardStats()
        setStats(statsData)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (loading) {
    return <div className="student-home" style={{ textAlign: 'center', padding: '100px' }}>Loading admin dashboard...</div>
  }

  return (
    <div className="student-home">
      <div className="home-welcome">
        <div className="welcome-text">
          <p className="welcome-date">{now}</p>
          <h2>Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋</h2>
          <p className="welcome-sub">System Overview: Administrator Control Panel.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Resources"
          value={stats.totalResources}
          unit="Assets"
          icon={FaBuilding}
          color="#484fd1"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          unit="Total"
          icon={FaCalendarCheck}
          color="#10b981"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          unit="Requests"
          icon={FaUserCheck}
          color="#ffb86c"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          unit="Members"
          icon={FaUsers}
          color="#ff85a1"
        />
      </div>

      <div className="home-sections">
        {/* Mock sections removed to ensure data integrity */}
      </div>
    </div>
  )
}

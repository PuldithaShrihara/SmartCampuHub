import { useState, useEffect } from 'react'
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarCheck,
  FaChartBar,
  FaTicketAlt,
  FaUserCheck,
  FaUsers
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchDashboardStats } from '../../api/dashboardApi.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import './AdminHome.css'

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

  const quickActions = [
    {
      label: 'Review all bookings',
      description: 'Approve, reject, and monitor booking requests.',
      path: '/admin/all-bookings',
      icon: FaCalendarCheck
    },
    {
      label: 'Manage resources',
      description: 'Update asset details and availability.',
      path: '/admin/resources',
      icon: FaBuilding
    },
    {
      label: 'Handle support tickets',
      description: 'Track open issues raised by users.',
      path: '/admin/tickets',
      icon: FaTicketAlt
    },
    {
      label: 'View platform statistics',
      description: 'Check trends and usage metrics.',
      path: '/admin/statistics',
      icon: FaChartBar
    }
  ]

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
    return (
      <div className="admin-home admin-loading">
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-home">
      <section className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-date">{now}</p>
          <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋</h1>
          <p>System Overview: Administrator Control Panel.</p>
        </div>
      </section>

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

      <section className="dashboard-sections">
        <div className="content-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-list">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.path} to={action.path} className="quick-action-item">
                  <span className="action-icon">
                    <Icon />
                  </span>
                  <span className="quick-action-meta">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <FaArrowRight />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h2>Platform Snapshot</h2>
          </div>
          <div className="snapshot-list">
            <div className="snapshot-item">
              <span className="snapshot-label">Booking pressure</span>
              <span className="snapshot-value">{stats.totalBookings} requests tracked</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Pending decisions</span>
              <span className="snapshot-value">{stats.pendingApprovals} awaiting review</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Community size</span>
              <span className="snapshot-value">{stats.totalUsers} active members</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

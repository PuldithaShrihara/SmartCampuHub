import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FaBuilding, 
  FaCalendarCheck, 
  FaUserCheck, 
  FaUsers, 
  FaArrowRight,
  FaPlusCircle,
  FaTicketAlt,
  FaCog,
  FaClock
} from 'react-icons/fa'
import { useAuth } from '../../context/useAuth.js'
import { fetchDashboardStats, fetchRecentPendingBookings } from '../../api/dashboardApi.js'
import './AdminHome.css'

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>
        <Icon />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value.toLocaleString()}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}

export default function AdminHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalResources: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    totalUsers: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, bookingsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentPendingBookings()
        ])
        setStats(statsData)
        setRecentBookings(bookingsData)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
  }

  return (
    <div className="admin-home">
      <header className="welcome-banner">
        <p>Member of Academic Staff</p>
        <h1>{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Admin'}</h1>
        <p>Welcome back! Here's what's happening on campus today.</p>
      </header>

      <section className="stats-grid">
        <StatCard 
          label="Total Resources" 
          value={stats.totalResources} 
          icon={FaBuilding} 
          colorClass="blue" 
        />
        <StatCard 
          label="Total Bookings" 
          value={stats.totalBookings} 
          icon={FaCalendarCheck} 
          colorClass="green" 
        />
        <StatCard 
          label="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={FaUserCheck} 
          colorClass="orange" 
        />
        <StatCard 
          label="Total Users" 
          value={stats.totalUsers} 
          icon={FaUsers} 
          colorClass="purple" 
        />
      </section>

      <div className="dashboard-sections">
        <section className="content-section">
          <div className="section-header">
            <h2>Recent Pending Bookings</h2>
            <Link to="/admin/pending-bookings" className="view-all">
              View All <FaArrowRight style={{ fontSize: '0.75rem' }} />
            </Link>
          </div>
          
          <div className="dash-table-wrap">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Student Info</th>
                  <th>Schedule</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>
                      {booking.resource?.name || 'Deleted Resource'}
                    </td>
                    <td>
                      <div className="student-info">
                        <span className="student-name">{booking.user?.fullName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{booking.user?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="booking-meta">
                        <FaClock style={{ fontSize: '0.8rem' }} />
                        {booking.bookingDate} | {booking.startTime}-{booking.endTime}
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-approve">Approve</button>
                        <button className="btn-reject">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No pending bookings at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-list">
            <Link to="/admin/resources" className="quick-action-item">
              <div className="action-icon"><FaPlusCircle /></div>
              Manage Resources
            </Link>
            <Link to="/admin/tickets" className="quick-action-item">
              <div className="action-icon"><FaTicketAlt /></div>
              Check Asset Tickets
            </Link>
            <Link to="/admin/statistics" className="quick-action-item">
              <div className="action-icon"><FaUsers /></div>
              User Analytics
            </Link>
            <Link to="/admin/settings" className="quick-action-item">
              <div className="action-icon"><FaCog /></div>
              System Settings
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

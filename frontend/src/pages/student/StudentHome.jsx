import { useEffect, useState } from 'react'
import { FaBuilding, FaClipboardList, FaTicketAlt, FaUsers } from 'react-icons/fa'
import { useAuth } from '../../context/useAuth.js'
import { getMyBookings } from '../../api/bookingApi.js'
import { getSystemOverviewStats } from '../../api/statsApi.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import '../../styles/StudentHome.css'

export default function StudentHome() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [systemStats, setSystemStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [loading, setLoading] = useState(true)

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  useEffect(() => {
    let cancelled = false

    async function loadSystemStatsFromDb() {
      try {
        const overview = await getSystemOverviewStats()
        if (!cancelled) {
          setSystemStats(overview)
          setStatsError('')
        }
      } catch (err) {
        console.error('Failed to load system stats', err)
        if (!cancelled) {
          setSystemStats(null)
          setStatsError(err?.message || 'Could not load system totals from the server.')
        }
      }
    }

    async function loadInitial() {
      setLoading(true)
      setStatsError('')
      try {
        const bookingData = await getMyBookings()
        if (!cancelled) setBookings(bookingData || [])
      } catch (err) {
        console.error('Failed to load bookings', err)
        if (!cancelled) setBookings([])
      }

      await loadSystemStatsFromDb()
      if (!cancelled) setLoading(false)
    }

    loadInitial()

    function onVisible() {
      if (document.visibilityState === 'visible') {
        loadSystemStatsFromDb()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  function formatStatValue(n) {
    if (n == null || Number.isNaN(Number(n))) return '0'
    return String(Number(n))
  }

  const stats = systemStats || {
    totalBookings: 0,
    totalResources: 0,
    totalTickets: 0,
    totalUsers: 0,
  }

  if (loading) {
    return <div className="student-home" style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>
  }

  return (
    <div className="student-home">
      <div className="home-welcome">
        <div className="welcome-text">
          <p className="welcome-date">{now}</p>
          <h2>Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! 👋</h2>
          <p className="welcome-sub">Manage your campus resource bookings with ease.</p>
        </div>
      </div>

      {statsError ? (
        <div className="dash-msg error" style={{ marginBottom: 8 }}>
          {statsError} Refresh the page after the backend is running.
        </div>
      ) : null}

      <div className="stats-grid stats-grid--four">
        <StatCard
          title="Bookings (MongoDB)"
          value={formatStatValue(stats.totalBookings)}
          unit="All users"
          icon={FaClipboardList}
          color="#484fd1"
        />
        <StatCard
          title="Resources"
          value={formatStatValue(stats.totalResources)}
          unit="Facilities & assets"
          icon={FaBuilding}
          color="#ffb86c"
        />
        <StatCard
          title="Tickets"
          value={formatStatValue(stats.totalTickets)}
          unit="Incidents"
          icon={FaTicketAlt}
          color="#10b981"
        />
        <StatCard
          title="Users"
          value={formatStatValue(stats.totalUsers)}
          unit="Accounts"
          icon={FaUsers}
          color="#8b5cf6"
        />
      </div>

      <div className="home-sections">
        <div className="section-card main-chart-area" style={{ flex: 1 }}>
          <div className="section-header">
            <div>
              <h3>Your recent bookings</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                This list is only your bookings. The first stat card is the total number of booking records stored in the database (all students and staff).
              </p>
            </div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td>{b.resourceName || 'Resource'}</td>
                    <td>{b.bookingDate}</td>
                    <td>
                      <span className={`dash-badge badge-${String(b.status || 'PENDING').toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

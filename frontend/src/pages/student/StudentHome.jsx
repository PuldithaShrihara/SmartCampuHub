import { useEffect, useState } from 'react'
import { FaCalendarCheck } from 'react-icons/fa'
import { useAuth } from '../../context/useAuth.js'
import { getMyBookings } from '../../api/bookingApi.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import '../../styles/StudentHome.css'

export default function StudentHome() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMyBookings()
        setBookings(data || [])
      } catch (err) {
        console.error('Failed to load bookings', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeCount = bookings.filter(b => b.status === 'APPROVED').length
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length

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

      <div className="stats-grid">
        <StatCard
          title="My Active Bookings"
          value={activeCount.toString().padStart(2, '0')}
          unit="Approved"
          icon={FaCalendarCheck}
          color="#484fd1"
        />
        <StatCard
          title="Pending Requests"
          value={pendingCount.toString().padStart(2, '0')}
          unit="In Review"
          icon={FaCalendarCheck}
          color="#ffb86c"
        />
        <StatCard
          title="Total Reservations"
          value={bookings.length.toString().padStart(2, '0')}
          unit="Total"
          icon={FaCalendarCheck}
          color="#10b981"
        />
      </div>

      <div className="home-sections">
        <div className="section-card main-chart-area" style={{ flex: 1 }}>
          <div className="section-header">
            <h3>Recent Booking Status</h3>
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
                      <span className={`dash-badge badge-${b.status.toLowerCase()}`}>
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

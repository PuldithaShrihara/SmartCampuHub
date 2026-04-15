import { useEffect, useMemo, useState } from 'react'
import { getAllBookings } from '../../api/bookingApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import { useAuth } from '../../context/useAuth.js'
import '../../styles/DashboardLayout.css'

function Stat({ label, value, color }) {
  return (
    <div className="dash-card" style={{ marginBottom: 0 }}>
      <h2>{label}</h2>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

export default function TechnicianHome() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      setLoading(true)
      setError('')
      try {
        const [bookingsData, resourcesData] = await Promise.all([
          getAllBookings(),
          fetchResources(),
        ])
        if (cancelled) return
        setBookings(Array.isArray(bookingsData) ? bookingsData : [])
        setResources(Array.isArray(resourcesData) ? resourcesData : [])
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Failed to load technician dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [])

  const bookingStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let pending = 0
    let approved = 0
    let resolvedToday = 0

    bookings.forEach((booking) => {
      const status = String(booking.status || '').toUpperCase()
      if (status === 'PENDING') pending += 1
      if (status === 'APPROVED') approved += 1
      if (status === 'COMPLETED' && booking.bookingDate === today) {
        resolvedToday += 1
      }
    })

    return { pending, approved, resolvedToday }
  }, [bookings])

  const recentBookings = useMemo(() => {
    return bookings
      .slice()
      .sort((a, b) => {
        const aDate = new Date(`${a.bookingDate || ''}T${a.startTime || '00:00'}`).getTime()
        const bDate = new Date(`${b.bookingDate || ''}T${b.startTime || '00:00'}`).getTime()
        return bDate - aDate
      })
      .slice(0, 5)
  }, [bookings])

  return (
    <div>
      <div className="dash-card" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
        color: '#fff',
        border: 'none',
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: 8 }}>Hello, {user?.fullName || 'Technician'}!</h2>
        <p style={{ margin: 0, color: '#e0e7ff', opacity: 0.9 }}>Welcome to your Technician Dashboard.</p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Stat label="Pending Bookings" value={bookingStats.pending} color="#ef4444" />
        <Stat label="Approved Bookings" value={bookingStats.approved} color="#f59e0b" />
        <Stat label="Completed Today" value={bookingStats.resolvedToday} color="#10b981" />
        <Stat label="Total Resources" value={resources.length} color="#6366f1" />
      </div>

      {loading && <div className="dash-card">Loading live dashboard data...</div>}
      {!loading && error && <div className="dash-card dash-msg error">{error}</div>}

      <div className="dash-card">
        <h2>Recent Bookings</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Resource</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !error && recentBookings.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ color: 'var(--text-muted)' }}>
                    No booking data available.
                  </td>
                </tr>
              )}
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="res-name">{b.userName || 'Unknown Student'}</div>
                    <div className="res-id">{b.userId}</div>
                  </td>
                  <td>
                    <div className="res-name">{b.resourceName || 'Unknown Resource'}</div>
                    <div className="res-id">{b.resourceId}</div>
                  </td>
                  <td>
                    <div>{b.bookingDate || '-'}</div>
                    <div className="res-id">{b.startTime} - {b.endTime}</div>
                  </td>
                  <td>
                    <span className={`dash-badge badge-${String(b.status || 'pending').toLowerCase().replace('_', '')}`}>
                      {String(b.status || 'PENDING').replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dash-card">
        <h2>Resource Inventory</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Showing live resource count from the backend: {resources.length}
        </p>
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { listNotifications } from '../../api/notifications.js'
import '../../styles/DashboardLayout.css'

const mockData = {
  pendingCount: 3,
  approvedCount: 5,
  rejectedCount: 1,
  cancelledCount: 0,
  recentBookings: [
    {
      id: 1,
      resource: 'Lecture Hall A',
      date: '25-Mar-2026',
      time: '14:00-16:00',
      status: 'PENDING',
    },
    {
      id: 2,
      resource: 'Lab 101',
      date: '26-Mar-2026',
      time: '10:00-12:00',
      status: 'APPROVED',
    },
  ],
}

function StatCard({ label, value }) {
  return (
    <div className="dash-card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginBottom: 10 }}>{label}</h2>
      <p style={{ fontSize: 32, margin: 0, color: '#1a237e', fontWeight: 700 }}>
        {value}
      </p>
    </div>
  )
}

export default function StudentHome() {
  const { user } = useAuth()
  const now = new Date().toLocaleString()
  const [latestNotifications, setLatestNotifications] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await listNotifications()
        if (!cancelled) setLatestNotifications(Array.isArray(res) ? res.slice(0, 3) : [])
      } catch {
        if (!cancelled) setLatestNotifications([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="dash-card">
        <h2>Hello, {user?.fullName || 'Student'}!</h2>
        <p style={{ color: '#616161', margin: '0 0 8px' }}>{now}</p>
        <p style={{ color: '#616161', margin: 0 }}>
          Welcome to Smart Campus Hub.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Pending Bookings" value={mockData.pendingCount} />
        <StatCard label="Approved Bookings" value={mockData.approvedCount} />
        <StatCard label="Rejected Bookings" value={mockData.rejectedCount} />
        <StatCard label="Cancelled Bookings" value={mockData.cancelledCount} />
      </div>

      <div className="dash-card">
        <h2>Your Recent Bookings</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentBookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.resource}</td>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>
                    <span className="dash-badge">{b.status}</span>
                  </td>
                  <td>
                    <button type="button" style={{ cursor: 'pointer' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card">
        <h2>Quick actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/student/bookings" className="dash-badge">
            + Create New Booking
          </Link>
          <Link to="/student/resources" className="dash-badge">
            Browse Resources
          </Link>
        </div>
      </div>

      <div className="dash-card">
        <h2>Latest Notifications</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {latestNotifications.map((n) => (
            <li key={n.id} style={{ marginBottom: 8, color: '#616161' }}>
              {n.message}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 12 }}>
          <Link to="/student/notifications">View all</Link>
        </p>
      </div>
    </div>
  )
}

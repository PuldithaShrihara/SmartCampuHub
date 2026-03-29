import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import '../DashboardLayout.css'

const mockData = {
  totalResources: 25,
  totalBookings: 150,
  pendingApprovals: 8,
  totalUsers: 1200,
  pendingBookings: [
    {
      id: 1,
      resource: 'Lecture Hall A',
      student: 'John Doe',
      date: '25-Mar',
      time: '14:00',
    },
    {
      id: 2,
      resource: 'Lab 101',
      student: 'Jane Smith',
      date: '26-Mar',
      time: '10:00',
    },
  ],
}

function Stat({ label, value, danger }) {
  return (
    <div className="dash-card" style={{ marginBottom: 0 }}>
      <h2>{label}</h2>
      <p
        style={{
          margin: 0,
          fontSize: 30,
          fontWeight: 700,
          color: danger ? '#c62828' : '#1a237e',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function AdminHome() {
  const { user } = useAuth()
  return (
    <div>
      <div className="dash-card">
        <h2>Hello, {user?.fullName || 'Admin'}!</h2>
        <p style={{ color: '#616161', margin: 0 }}>Admin Dashboard</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Stat label="Total Resources" value={mockData.totalResources} />
        <Stat label="Total Bookings" value={mockData.totalBookings} />
        <Stat
          label="Pending Approvals"
          value={mockData.pendingApprovals}
          danger={mockData.pendingApprovals > 0}
        />
        <Stat label="Total Users" value={mockData.totalUsers} />
      </div>

      <div className="dash-card">
        <h2>Quick actions</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/pending-bookings" className="dash-badge">
            Review Pending Bookings
          </Link>
          <Link to="/admin/resources" className="dash-badge">
            Manage Resources
          </Link>
          <Link to="/admin/statistics" className="dash-badge">
            View Statistics
          </Link>
          <Link to="/admin/resources" className="dash-badge">
            Create Resource
          </Link>
        </div>
      </div>

      <div className="dash-card">
        <h2>
          Pending Bookings{' '}
          <span className="dash-badge">{mockData.pendingApprovals}</span>
        </h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Student</th>
                <th>Date</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockData.pendingBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.resource}</td>
                  <td>{booking.student}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>
                    <button type="button">APPROVE</button>{' '}
                    <button type="button">REJECT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12 }}>
          <Link to="/admin/pending-bookings">View all pending</Link>
        </p>
      </div>
    </div>
  )
}

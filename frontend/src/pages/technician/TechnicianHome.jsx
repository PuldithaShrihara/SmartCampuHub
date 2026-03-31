import { useAuth } from '../../context/useAuth.js'
import '../../styles/DashboardLayout.css'

const mockData = {
  openTickets: 5,
  inProgressTickets: 2,
  resolvedToday: 3,
  assignedResources: 3,
  tickets: [
    { id: 1, title: 'Projector broken', priority: 'HIGH', status: 'OPEN' },
    {
      id: 2,
      title: 'AC not working',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
  ],
}

function Stat({ label, value, color }) {
  return (
    <div className="dash-card" style={{ marginBottom: 0 }}>
      <h2>{label}</h2>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

export default function TechnicianHome() {
  const { user } = useAuth()
  return (
    <div>
      <div className="dash-card">
        <h2>Hello, {user?.fullName || 'Technician'}!</h2>
        <p style={{ margin: 0, color: '#616161' }}>Technician Dashboard</p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Stat label="Open Tickets" value={mockData.openTickets} color="#c62828" />
        <Stat
          label="In Progress Tickets"
          value={mockData.inProgressTickets}
          color="#ef6c00"
        />
        <Stat label="Resolved Today" value={mockData.resolvedToday} color="#2e7d32" />
        <Stat
          label="Assigned Resources"
          value={mockData.assignedResources}
          color="#1a237e"
        />
      </div>
      <div className="dash-card">
        <h2>My Assigned Tickets</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockData.tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.priority}</td>
                  <td>{t.status}</td>
                  <td>
                    <button type="button">Take Action</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dash-card">
        <h2>Resource Booking Schedule</h2>
        <p style={{ color: '#616161', margin: 0 }}>
          Lab 101 is booked 10:00-12:00 today, available after.
        </p>
      </div>
    </div>
  )
}

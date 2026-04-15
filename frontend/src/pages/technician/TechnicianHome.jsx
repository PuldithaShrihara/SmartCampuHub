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
      <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

export default function TechnicianHome() {
  const { user } = useAuth()
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
        <Stat label="Open Tickets" value={mockData.openTickets} color="#ef4444" />
        <Stat
          label="In Progress"
          value={mockData.inProgressTickets}
          color="#f59e0b"
        />
        <Stat label="Resolved Today" value={mockData.resolvedToday} color="#10b981" />
        <Stat
          label="Assigned Venues"
          value={mockData.assignedResources}
          color="#6366f1"
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
                  <td>
                    <div className="res-name">{t.title}</div>
                  </td>
                  <td>
                    <span className="dash-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>{t.priority}</span>
                  </td>
                  <td>
                    <span className={`dash-badge badge-${t.status.toLowerCase().replace('_', '')}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="dash-btn-outline">Take Action</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dash-card">
        <h2>Resource Booking Schedule</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Lab 101 is booked 10:00-12:00 today, available after.
        </p>
      </div>
    </div>
  )
}


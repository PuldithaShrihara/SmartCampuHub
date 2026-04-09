import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import MainCalendar from '../../components/dashboard/MainCalendar'
import '../../styles/DashboardRedesign.css'

const venues = [
  { id: 'lecture-hall-a', name: 'Lecture Hall A', capacity: 200, status: 'Busy' },
  { id: 'lab-101', name: 'Lab 101', capacity: 30, status: 'Free' },
  { id: 'seminar-room', name: 'Seminar Room', capacity: 50, status: 'Free' },
  { id: 'auditorium', name: 'Auditorium', capacity: 500, status: 'Busy' },
]

export default function AdminHome() {
  const { user } = useAuth()
  
  return (
    <div className="admin-home">
      {/* Premium Welcome Card */}
      <div className="dash-card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: '#fff',
        border: 'none',
        padding: '30px'
      }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.75rem' }}>Hello, {user?.fullName || 'Admin'}!</h2>
          <p style={{ color: '#94a3b8', margin: '8px 0 0 0' }}>Welcome back to your Smart Campus dashboard.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>System Status</div>
          <div style={{ fontWeight: 600, color: '#10b981' }}>● All systems operational</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginTop: 24 }}>
        {/* Main Content: Calendar */}
        <div>
          <MainCalendar />
        </div>

        {/* Sidebar: Venues Analyis Selection */}
        <div className="dash-card">
          <h3 style={{ marginBottom: 16 }}>Resource Venues</h3>
          <p style={{ fontSize: 13, color: 'var(--cal-muted)', marginBottom: 20 }}>
            Click on a venue to view its weekly analysis and occupancy data.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {venues.map(venue => (
              <Link 
                key={venue.id}
                to={`/admin/analysis/${venue.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--cal-border)',
                  background: '#fff',
                  transition: 'all 0.2s'
                }}
                className="venue-item-link"
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cal-text)' }}>{venue.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--cal-muted)' }}>Cap: {venue.capacity}</div>
                </div>
                <div style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: venue.status === 'Free' ? '#10b981' : '#f59e0b',
                  background: venue.status === 'Free' ? '#ecfdf5' : '#fffbeb',
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  {venue.status}
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--cal-border)' }}>
            <h4 style={{ fontSize: 14, marginBottom: 12 }}>Quick Stats</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--cal-muted)' }}>Total Venue Usage</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>78%</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: 'var(--cal-primary)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

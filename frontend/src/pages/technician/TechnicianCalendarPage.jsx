import { useEffect, useState } from 'react'
import { getAllBookings } from '../../api/bookingApi.js'

export default function TechnicianCalendarPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await getAllBookings()
        setBookings(data || [])
      } catch (err) {
        setError(err.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  return (
    <>
      <section className="dash-card">
        <h2>Booking Calendar</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review all campus resource bookings.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Booking Records</h3>
        {loading ? (
          <p>Loading bookings...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : bookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No bookings found.</p>
        ) : (
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
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="res-name">{b.userName}</div>
                      <div className="res-id">{b.userId}</div>
                    </td>
                    <td>
                      <div className="res-name">{b.resourceName || 'Unknown Resource'}</div>
                      <div className="res-id">{b.resourceId}</div>
                    </td>
                    <td>
                      <div>{b.bookingDate}</div>
                      <div className="res-id">{b.startTime} - {b.endTime}</div>
                    </td>
                    <td>
                      <span className={`dash-badge badge-${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}


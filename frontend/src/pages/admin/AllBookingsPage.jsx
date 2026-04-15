import { useEffect, useState } from 'react'
import { getAllBookings } from '../../api/bookingApi.js'

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredBookings = bookings.filter((booking) => {
    if (!normalizedSearch) return true

    const haystack = [
      booking.userName,
      booking.userId,
      booking.resourceName,
      booking.resourceId,
      booking.status,
      booking.bookingDate,
      booking.startTime,
      booking.endTime,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  return (
    <>
      <section className="dash-card">
        <h2>All Bookings</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Central list of every booking request submitted across the campus.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Booking Records</h3>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, resource, date, or status..."
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: '#fff',
            }}
          />
        </div>
        {loading ? (
          <p>Loading bookings...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : filteredBookings.length === 0 ? (
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
                {filteredBookings.map((b) => (
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


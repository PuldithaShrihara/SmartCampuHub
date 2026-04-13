import { useState, useEffect } from 'react'
import BookingForm from '../../components/booking/BookingForm.jsx'
import Modal from '../../components/common/Modal.jsx'
import { createBooking, getMyBookings } from '../../api/bookingApi.js'

export default function MyBookingsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchBookings() {
    try {
      setLoading(true)
      const data = await getMyBookings()
      setBookings(data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  async function handleDraftSubmit(data) {
    try {
      await createBooking(data)
      alert('Booking submitted successfully!')
      setShowCreateForm(false)
      fetchBookings() // Refresh the list
    } catch (err) {
      alert('Failed to submit booking: ' + err.message)
    }
  }

  return (
    <>
      <section className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2>My Bookings</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Review all your booking requests and track their approval status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="dash-btn"
          >
            + Create Booking
          </button>
        </div>

        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create New Booking"
        >
          <BookingForm onSubmit={handleDraftSubmit} />
        </Modal>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Requests</h3>
          {loading ? (
            <p>Loading bookings...</p>
          ) : error ? (
            <div className="dash-msg error">
              Failed to load bookings: {error}. Please ensure the backend server is running.
            </div>
          ) : bookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12 }}>
              No bookings to show yet. Create a booking to see it listed here.
            </p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="res-name">{b.resourceName || 'Unknown Resource'}</div>
                        <div className="res-id">{b.resourceId}</div>
                      </td>
                      <td>{b.bookingDate}</td>
                      <td>{b.startTime} - {b.endTime}</td>
                      <td>
                        <span className={`dash-badge badge-${b.status?.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

import { useState } from 'react'
import BookingForm from '../../components/booking/BookingForm.jsx'

export default function MyBookingsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const dummyBookings = [
    { id: 'BK-1021', resource: 'Lecture Hall A', date: '2026-04-03', status: 'APPROVED' },
    { id: 'BK-1028', resource: 'Physics Lab', date: '2026-04-05', status: 'PENDING' },
    { id: 'BK-1034', resource: 'Seminar Room 2', date: '2026-04-07', status: 'REJECTED' },
  ]

  function handleDraftSubmit() {
    // Placeholder until API integration is added.
    alert('Booking draft captured. Backend submission will be added next.')
  }

  return (
    <>
      <section className="dash-card">
        <h2>My Bookings</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review all your booking requests and track their approval status.
        </p>
        <button
          type="button"
          className="dash-badge"
          style={{ marginTop: 12, cursor: 'pointer' }}
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? 'Hide Create Booking Form' : 'Create Booking'}
        </button>
      </section>

      {showCreateForm && (
        <section className="dash-card">
          <h3 style={{ marginBottom: 12 }}>Create Booking</h3>
          <BookingForm onSubmit={handleDraftSubmit} />
        </section>
      )}

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Recent Requests (Dummy)</h3>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Resource</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dummyBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.resource}</td>
                  <td>{booking.date}</td>
                  <td>
                    <span className="dash-badge">{booking.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

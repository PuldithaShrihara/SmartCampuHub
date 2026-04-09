import { useState } from 'react'
import BookingForm from '../../components/booking/BookingForm.jsx'

export default function MyBookingsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

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
          style={{
            marginTop: 12,
            cursor: 'pointer',
            background: '#2563eb',
            color: '#ffffff',
            border: '1px solid #1d4ed8',
            borderRadius: 8,
            padding: '8px 14px',
            fontWeight: 600,
          }}
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
        <h3 style={{ marginBottom: 12 }}>Recent Requests</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          No bookings to show yet. Create a booking to see it listed here.
        </p>
      </section>
    </>
  )
}

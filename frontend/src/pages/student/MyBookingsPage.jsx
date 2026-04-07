export default function MyBookingsPage() {
  const dummyBookings = [
    { id: 'BK-1021', resource: 'Lecture Hall A', date: '2026-04-03', status: 'APPROVED' },
    { id: 'BK-1028', resource: 'Physics Lab', date: '2026-04-05', status: 'PENDING' },
    { id: 'BK-1034', resource: 'Seminar Room 2', date: '2026-04-07', status: 'REJECTED' },
  ]

  return (
    <>
      <section className="dash-card">
        <h2>My Bookings</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review all your booking requests and track their approval status.
        </p>
      </section>

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

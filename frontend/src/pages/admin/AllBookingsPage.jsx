export default function AllBookingsPage() {
 

  return (
    <>
      <section className="dash-card">
        <h2>All Bookings</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Central list of every booking request submitted across the campus.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Booking Records (Dummy)</h3>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Resource</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.student}</td>
                  <td>{row.resource}</td>
                  <td><span className="dash-badge">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

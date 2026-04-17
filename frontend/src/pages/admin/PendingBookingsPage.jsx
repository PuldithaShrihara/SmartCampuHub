export default function PendingBookingsPage() {
 

  return (
    <>
      <section className="dash-card">
        <h2>Pending Bookings</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review requests awaiting admin action and prioritize approvals.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Waiting Queue (Dummy)</h3>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Resource</th>
                <th>Requested At</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.student}</td>
                  <td>{row.resource}</td>
                  <td>{row.requestedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

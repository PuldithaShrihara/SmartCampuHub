export default function PendingBookingsPage() {
  const pendingRows = [
    { id: 'BK-3011', student: 'Nisha', resource: 'Design Studio', requestedAt: '2026-04-01 10:15' },
    { id: 'BK-3012', student: 'Karan', resource: 'Computer Lab 3', requestedAt: '2026-04-01 11:20' },
    { id: 'BK-3013', student: 'Sana', resource: 'Auditorium', requestedAt: '2026-04-01 12:05' },
  ]

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

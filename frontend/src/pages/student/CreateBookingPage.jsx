export default function CreateBookingPage() {
  return (
    <>
      <section className="dash-card">
        <h2>Create Booking</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Use this page to prepare a new resource booking request.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Quick Draft Form (Dummy)</h3>
        <div className="dash-form-grid">
          <div>
            <label>Resource</label>
            <input placeholder="e.g. Computer Lab 2" disabled />
          </div>
          <div>
            <label>Date</label>
            <input placeholder="YYYY-MM-DD" disabled />
          </div>
          <div>
            <label>Time Slot</label>
            <input placeholder="09:00 - 11:00" disabled />
          </div>
          <button type="button" disabled>
            Submit Booking (coming soon)
          </button>
        </div>
      </section>
    </>
  )
}

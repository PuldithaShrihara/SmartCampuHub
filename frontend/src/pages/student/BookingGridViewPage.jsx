export default function BookingGridViewPage() {
  const demoSlots = [
    { resource: 'Lecture Hall A', slot: '09:00 - 10:00', state: 'Available' },
    { resource: 'Computer Lab 1', slot: '10:00 - 11:00', state: 'Booked' },
    { resource: 'Seminar Room 3', slot: '11:00 - 12:00', state: 'Available' },
    { resource: 'Innovation Hub', slot: '12:00 - 13:00', state: 'Maintenance' },
  ]

  return (
    <>
      <section className="dash-card">
        <h2>Booking Grid View</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Visual overview of resource availability by time slot.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Grid Preview (Dummy)</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {demoSlots.map((item) => (
            <article
              key={`${item.resource}-${item.slot}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 12,
                background: 'var(--surface-muted)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 6 }}>{item.resource}</strong>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                {item.slot}
              </div>
              <span className="dash-badge">{item.state}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

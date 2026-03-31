const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const blocks = [
  { day: 'Mon', status: 'Available' },
  { day: 'Tue', status: 'Reserved' },
  { day: 'Wed', status: 'Available' },
  { day: 'Thu', status: 'Ongoing' },
  { day: 'Fri', status: 'Available' },
  { day: 'Sat', status: 'Reserved' },
  { day: 'Sun', status: 'Out of Service' },
]

const colorByStatus = {
  Available: '#dcfce7',
  Ongoing: '#fef3c7',
  Reserved: '#dbeafe',
  'Out of Service': '#fee2e2',
}

export default function BookingCalendar() {
  return (
    <section className="dash-card">
      <h3 style={{ marginBottom: 10 }}>Booking Calendar (Preview)</h3>
      <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
        Visual weekly placeholder calendar for resource occupancy.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(80px, 1fr))',
          gap: 10,
        }}
      >
        {days.map((day) => {
          const block = blocks.find((item) => item.day === day)
          const bg = colorByStatus[block?.status] || '#f1f5f9'
          return (
            <div
              key={day}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--surface)',
                overflow: 'hidden',
                minHeight: 90,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {day}
              </div>
              <div style={{ padding: 10, fontSize: 12, background: bg }}>{block?.status}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

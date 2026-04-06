import BookingStatusBadge from './BookingStatusBadge.jsx'

const statuses = ['Available', 'Ongoing', 'Reserved', 'Out of Service']

export default function AvailabilityLegend() {
  return (
    <div className="dash-card" style={{ marginBottom: 0 }}>
      <h3 style={{ fontSize: 16, marginBottom: 10 }}>Availability Legend</h3>
      <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
        Quick color guide for booking status visibility.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {statuses.map((status) => (
          <BookingStatusBadge key={status} status={status} />
        ))}
      </div>
    </div>
  )
}

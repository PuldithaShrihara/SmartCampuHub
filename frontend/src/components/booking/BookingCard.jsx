import BookingStatusBadge from './BookingStatusBadge.jsx'

export default function BookingCard({
  name = 'Innovation Lab',
  location = 'Tech Block - Floor 2',
  capacity = 40,
  status = 'Available',
}) {
  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 14,
        boxShadow: 'var(--shadow)',
      }}
    >
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>{name}</h3>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{location}</p>
      <p style={{ margin: '8px 0 10px', color: 'var(--text-muted)', fontSize: 13 }}>
        Capacity: {capacity}
      </p>
      <BookingStatusBadge status={status} />
    </article>
  )
}

const STATUS_STYLE = {
  Available: { background: '#ecfdf3', color: '#166534', border: '#bbf7d0' },
  Ongoing: { background: '#fffbeb', color: '#92400e', border: '#fde68a' },
  Reserved: { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Out of Service': { background: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

export default function BookingStatusBadge({ status = 'Available' }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.Available

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {status}
    </span>
  )
}

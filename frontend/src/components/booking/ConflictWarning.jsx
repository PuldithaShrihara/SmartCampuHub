export default function ConflictWarning({
  title = 'Time Slot Conflict Detected',
  message = 'Selected slot overlaps with an existing reservation. Please choose another time.',
}) {
  return (
    <div
      role="alert"
      style={{
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: '#991b1b',
        borderRadius: 10,
        padding: 12,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
      <span style={{ fontSize: 14 }}>{message}</span>
    </div>
  )
}

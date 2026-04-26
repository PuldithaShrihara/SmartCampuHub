function normalizeStatus(status) {
  return String(status || 'Pending').trim().toLowerCase()
}

function statusClass(status) {
  const normalized = normalizeStatus(status)
  if (normalized === 'resolved') return 'ticket-status resolved'
  if (normalized === 'in progress') return 'ticket-status progress'
  return 'ticket-status pending'
}

function statusLabel(status) {
  const normalized = normalizeStatus(status)
  if (normalized === 'in progress') return 'In Progress'
  if (normalized === 'resolved') return 'Resolved'
  return 'Pending'
}

export default function TicketStatusBadge({ status }) {
  return <span className={statusClass(status)}>{statusLabel(status)}</span>
}

import { useEffect, useState } from 'react'
import { adminListTechnicians } from '../../api/auth.js'
import { getAllIncidents, updateIncident } from '../../api/incidentApi.js'
import '../../styles/TicketsPage.css'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

function statusClass(status) {
  // Convert any incoming value to lowercase text so comparisons are safe.
  const normalized = String(status || '').toLowerCase()
  // Return CSS class for Resolved status badge.
  if (normalized === 'resolved') return 'ticket-status resolved'
  // Return CSS class for In Progress status badge.
  if (normalized === 'in progress') return 'ticket-status progress'
  // Default badge class is Pending.
  return 'ticket-status pending'
}

function effectiveAssignmentStatus(item) {
  if (item.assignmentStatus && item.assignmentStatus !== 'Unassigned') {
    return item.assignmentStatus
  }
  return item.assignedTo ? 'Assigned' : 'Unassigned'
}

function statusFlowHint(item) {
  const st = String(item.status || '').toLowerCase()
  const assign = effectiveAssignmentStatus(item)
  if (st === 'pending' && assign === 'Assigned') {
    return 'Waiting for technician to accept'
  }
  if (st === 'in progress') {
    return 'Technician has accepted; work in progress'
  }
  if (st === 'resolved') {
    return 'Closed'
  }
  return null
}

function getStatusCounts(incidents) {
  // Build summary counters for dashboard mini pills.
  return incidents.reduce(
    (acc, item) => {
      // Read each incident status safely.
      const key = String(item.status || '').toLowerCase()
      // Increase matching bucket.
      if (key === 'resolved') acc.resolved += 1
      else if (key === 'in progress') acc.inProgress += 1
      else acc.pending += 1
      // Return updated accumulator to next reduce loop.
      return acc
    },
    // Initial values before counting starts.
    { pending: 0, inProgress: 0, resolved: 0 }
  )
}

export default function Tickets() {
  // Selected status filter from dropdown (empty means all statuses).
  const [statusFilter, setStatusFilter] = useState('')
  // Full incident list for admin table.
  const [incidents, setIncidents] = useState([])
  // Technician list used in assignment dropdown.
  const [technicians, setTechnicians] = useState([])
  // Error message shown in UI if API action fails.
  const [error, setError] = useState('')
  // Loading state while incidents are being fetched.
  const [loading, setLoading] = useState(false)
  // Track incident currently being assigned to disable only that row control.
  const [assigningId, setAssigningId] = useState('')
  // Technician-list loading state for assignment UX.
  const [loadingTechnicians, setLoadingTechnicians] = useState(false)
  // Error text for technician availability list loading.
  const [technicianError, setTechnicianError] = useState('')
  // Derived totals used in hero summary cards.
  const statusCounts = getStatusCounts(incidents)

  async function loadIncidents() {
    // Method purpose: fetch incidents (all or by selected status).
    try {
      // Start loading spinner and clear old error.
      setLoading(true)
      setError('')
      // Call backend with optional status filter.
      const res = await getAllIncidents(statusFilter)
      // Defensive shape validation: API wrappers may return unexpected payloads on integration changes.
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      // Show user-friendly API error.
      setError(err.message || 'Could not load incidents')
    } finally {
      // Always stop loading state.
      setLoading(false)
    }
  }

  async function loadTechnicians() {
    try {
      setLoadingTechnicians(true)
      setTechnicianError('')
      const list = await adminListTechnicians()
      setTechnicians(Array.isArray(list) ? list : [])
    } catch (err) {
      setTechnicians([])
      setTechnicianError(err?.message || 'Could not load available technicians')
    } finally {
      setLoadingTechnicians(false)
    }
  }

  useEffect(() => {
    // Keep both tickets and available technicians in sync in near-real-time.
    loadIncidents()
    loadTechnicians()
    const intervalId = window.setInterval(() => {
      loadIncidents()
      loadTechnicians()
    }, 8000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [statusFilter])

  async function handleAssignTechnician(incidentId, technicianUserId) {
    // Method purpose: admin assigns or unassigns technician for one incident.
    try {
      // Lock this row while update is processing.
      setAssigningId(incidentId)
      setError('')
      // Backend validates technician id/role; frontend sends raw selected value (including empty for unassign).
      await updateIncident(incidentId, { assignedTo: technicianUserId })
      // Match requested native popup success style.
      window.alert(technicianUserId ? 'Technician assigned successfully.' : 'Technician unassigned successfully.')
      // Refresh both table and availability list immediately.
      await Promise.all([loadIncidents(), loadTechnicians()])
    } catch (err) {
      setError(err.message || 'Could not assign technician')
    } finally {
      // Unlock row controls.
      setAssigningId('')
    }
  }

  return (
    <div className="tickets-page">
      <section className="dash-card tickets-hero">
        <div className="tickets-hero-copy">
          <h2>All Incident Tickets</h2>
          <p>Track incidents, assign technicians, and monitor progress in one place.</p>
        </div>
        <div className="tickets-count-grid">
          <div className="tickets-total">
            <span>Total</span>
            <strong>{incidents.length}</strong>
          </div>
          <div className="tickets-mini-badges">
            <span className="mini-pill pending">Pending {statusCounts.pending}</span>
            <span className="mini-pill progress">In Progress {statusCounts.inProgress}</span>
            <span className="mini-pill resolved">Resolved {statusCounts.resolved}</span>
          </div>
        </div>
      </section>

      <section className="dash-card tickets-table-card">
      {error ? <div className="dash-msg error">{error}</div> : null}

      <div className="tickets-toolbar">
        <div className="tickets-filter">
          <label htmlFor="ticket-status-filter">Filter by status</label>
          <select
            id="ticket-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <span className="tickets-meta">
          {loading
            ? 'Loading incidents...'
            : loadingTechnicians
              ? `Refreshing availability... ${incidents.length} ticket(s) found`
              : `${incidents.length} ticket(s) found`}
        </span>
      </div>
      {technicianError ? <div className="dash-msg error">{technicianError}</div> : null}

      <div className="dash-table-wrap">
        <table className="dash-table tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Attachment</th>
              <th>Status</th>
              <th>Assigned technician</th>
              <th>Technician Remarks</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="tickets-empty-state">
                  No incidents found.
                </td>
              </tr>
            ) : (
              incidents.map((item) => {
                // Support both expanded object form and plain id form for backward-compatible API responses.
                const assignedId =
                  typeof item.assignedTo === 'object' && item.assignedTo?.id
                    ? item.assignedTo.id
                    : typeof item.assignedTo === 'string'
                      ? item.assignedTo
                      : ''
                const assignedName =
                  typeof item.assignedTo === 'object'
                    ? item.assignedTo?.fullName || item.assignedTo?.email || 'Current technician'
                    : 'Current technician'
                const isAssignedTechnicianAvailable = technicians.some((t) => t.id === assignedId)
                const isResolved = String(item.status || '').toLowerCase() === 'resolved'
                const statusHint = statusFlowHint(item)
                return (
                  <tr key={item.id}>
                    <td className="tickets-title-cell">{item.title}</td>
                    <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                    <td>{item.resourceId?.name || '-'}</td>
                    <td>
                      {item.attachmentPath ? (
                        <a className="tickets-file-link" href={item.attachmentPath} target="_blank" rel="noreferrer">
                          View file
                        </a>
                      ) : (
                        <span className="tickets-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="tickets-status-cell">
                        <div className="tickets-status-stack">
                          <span className={statusClass(item.status)}>{item.status}</span>
                          {statusHint ? (
                            <span className="tickets-status-hint">{statusHint}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="tickets-assign-select"
                        value={assignedId}
                        disabled={assigningId === item.id || isResolved}
                        onChange={(e) => handleAssignTechnician(item.id, e.target.value)}
                        aria-label={`Assign technician for ${item.title}`}
                      >
                        <option value="">Unassigned</option>
                        {assignedId && !isAssignedTechnicianAvailable ? (
                          <option value={assignedId}>{assignedName} (busy)</option>
                        ) : null}
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName || t.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.technicianRemarks || <span className="tickets-muted">-</span>}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      </section>
    </div>
  )
}

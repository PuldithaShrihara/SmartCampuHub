import { useEffect, useState } from 'react'
import { adminListTechnicians } from '../../api/auth.js'
import { getAllIncidents, updateIncident } from '../../api/incidentApi.js'
import '../../styles/TicketsPage.css'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'resolved') return 'ticket-status resolved'
  if (normalized === 'in progress') return 'ticket-status progress'
  return 'ticket-status pending'
}

function getStatusCounts(incidents) {
  return incidents.reduce(
    (acc, item) => {
      const key = String(item.status || '').toLowerCase()
      if (key === 'resolved') acc.resolved += 1
      else if (key === 'in progress') acc.inProgress += 1
      else acc.pending += 1
      return acc
    },
    { pending: 0, inProgress: 0, resolved: 0 }
  )
}

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState('')
  const [incidents, setIncidents] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState('')
  const statusCounts = getStatusCounts(incidents)

  async function loadIncidents() {
    try {
      setLoading(true)
      setError('')
      const res = await getAllIncidents(statusFilter)
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [statusFilter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await adminListTechnicians()
        if (!cancelled) {
          setTechnicians(Array.isArray(list) ? list : [])
        }
      } catch {
        if (!cancelled) setTechnicians([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAssignTechnician(incidentId, technicianUserId) {
    try {
      setAssigningId(incidentId)
      setError('')
      await updateIncident(incidentId, { assignedTo: technicianUserId })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not assign technician')
    } finally {
      setAssigningId('')
    }
  }

  return (
    <div className="tickets-page">
      <section className="dash-card tickets-hero">
        <div>
          <h2>All Incident Tickets</h2>
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
          {loading ? 'Loading incidents...' : `${incidents.length} ticket(s) found`}
        </span>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Assigned technician</th>
              <th>Technician Remarks</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="tickets-empty-state">
                  No incidents found.
                </td>
              </tr>
            ) : (
              incidents.map((item) => {
                const assignedId =
                  typeof item.assignedTo === 'object' && item.assignedTo?.id
                    ? item.assignedTo.id
                    : typeof item.assignedTo === 'string'
                      ? item.assignedTo
                      : ''
                return (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                    <td>{item.resourceId?.name || '-'}</td>
                    <td>
                      <div className="tickets-status-cell">
                        <span className={statusClass(item.status)}>{item.status}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="tickets-assign-select"
                        value={assignedId}
                        disabled={assigningId === item.id}
                        onChange={(e) => handleAssignTechnician(item.id, e.target.value)}
                        aria-label={`Assign technician for ${item.title}`}
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName || t.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.technicianRemarks || '-'}</td>
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

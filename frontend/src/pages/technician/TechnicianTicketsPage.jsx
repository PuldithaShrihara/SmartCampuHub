import { useEffect, useState } from 'react'
import {
  acceptIncidentAssignment,
  declineIncidentAssignment,
  getAllIncidents,
  updateIncident,
} from '../../api/incidentApi.js'
import { useAuth } from '../../context/useAuth.js'
import { useToast } from '../../components/toastContext.js'
import '../../styles/TechnicianTicketsPage.css'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

export default function TechnicianTicketsPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [incidents, setIncidents] = useState([])
  const [error, setError] = useState('')
  const [remarksById, setRemarksById] = useState({})
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [onlyMyTickets, setOnlyMyTickets] = useState(false)

  const statusCounts = visibleCounts(incidents)

  async function loadIncidents() {
    try {
      setError('')
      const res = await getAllIncidents('')
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadIncidents()
    }, 8000)
    return () => window.clearInterval(intervalId)
  }, [])

  function effectiveAssignmentStatus(item) {
    if (item.assignmentStatus && item.assignmentStatus !== 'Unassigned') {
      return item.assignmentStatus
    }
    return item.assignedTo ? 'Assigned' : 'Unassigned'
  }

  function assignedToLabel(item) {
    if (!item.assignedTo) return 'Unassigned'
    if (typeof item.assignedTo === 'object') {
      return item.assignedTo.fullName || item.assignedTo.email || 'Assigned'
    }
    return 'Assigned'
  }

  const visibleIncidents = onlyMyTickets
    ? incidents.filter((item) => item.assignedTo?.email === user?.email)
    : incidents

  async function handleStatusChange(incidentId, status) {
    try {
      const res = await updateIncident(incidentId, { status })
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not update status')
      }
      pushToast({ type: 'success', message: 'Incident status updated.' })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not update status')
    }
  }

  async function saveRemarks(incidentId) {
    try {
      const res = await updateIncident(incidentId, {
        technicianRemarks: remarksById[incidentId] || '',
      })
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not save remarks')
      }
      pushToast({ type: 'success', message: 'Remarks saved successfully.' })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not save remarks')
    }
  }

  async function handleAccept(incidentId) {
    try {
      setActionLoadingId(incidentId)
      const res = await acceptIncidentAssignment(incidentId)
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not accept assignment')
      }
      pushToast({ type: 'success', message: 'Assignment accepted.' })
      window.dispatchEvent(new Event('notifications:changed'))
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not accept assignment')
    } finally {
      setActionLoadingId('')
    }
  }

  async function handleDecline(incidentId) {
    try {
      setActionLoadingId(incidentId)
      const res = await declineIncidentAssignment(incidentId)
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not decline assignment')
      }
      pushToast({ type: 'success', message: 'Assignment declined.' })
      window.dispatchEvent(new Event('notifications:changed'))
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not decline assignment')
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <div className="tech-tickets-page">
      <section className="dash-card tech-tickets-hero">
        <div className="tech-tickets-hero-copy">
          <h2>Incident Tickets</h2>
          <p>Review assigned incidents, accept work, and keep status up to date.</p>
        </div>
        <div className="tech-tickets-count-grid">
          <div className="tech-tickets-total">
            <span>Total</span>
            <strong>{incidents.length}</strong>
          </div>
          <div className="tech-tickets-mini-badges">
            <span className="tech-mini-pill pending">Pending {statusCounts.pending}</span>
            <span className="tech-mini-pill progress">In Progress {statusCounts.inProgress}</span>
            <span className="tech-mini-pill resolved">Resolved {statusCounts.resolved}</span>
          </div>
        </div>
      </section>

      <section className="dash-card tech-tickets-table-card">
        {error ? <div className="dash-msg error">{error}</div> : null}
        <div className="tech-tickets-toolbar">
          <label className="tech-toggle">
            <input
              type="checkbox"
              checked={onlyMyTickets}
              onChange={(e) => setOnlyMyTickets(e.target.checked)}
            />
            <span>Only my tickets</span>
          </label>
          <span className="tech-tickets-meta">{visibleIncidents.length} ticket(s) shown</span>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table tech-tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Attachment</th>
              <th>Assigned To</th>
              <th>Assignment</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="tech-tickets-empty-state">No incidents found.</td>
              </tr>
            ) : (
              visibleIncidents.map((item) => (
                <tr key={item.id}>
                  <td className="tech-tickets-title-cell">{item.title}</td>
                  <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                  <td>{item.resourceId?.name || '-'}</td>
                  <td>
                    {item.attachmentPath ? (
                      <a className="tech-file-link" href={item.attachmentPath} target="_blank" rel="noreferrer">
                        View file
                      </a>
                    ) : (
                      <span className="tech-muted">-</span>
                    )}
                  </td>
                  <td>{assignedToLabel(item)}</td>
                  <td>
                    {item.assignedTo?.email === user?.email && effectiveAssignmentStatus(item) === 'Assigned' ? (
                      <div className="tech-assign-actions">
                        <button
                          type="button"
                          className="tech-accept-btn"
                          onClick={() => handleAccept(item.id)}
                          disabled={actionLoadingId === item.id}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="tech-decline-btn"
                          onClick={() => handleDecline(item.id)}
                          disabled={actionLoadingId === item.id}
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      effectiveAssignmentStatus(item)
                    )}
                  </td>
                  <td>
                    <select
                      className="tech-status-select"
                      value={item.status}
                      disabled={
                        item.assignedTo?.email === user?.email &&
                        effectiveAssignmentStatus(item) === 'Assigned'
                      }
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="tech-remarks-input"
                      value={remarksById[item.id] ?? item.technicianRemarks ?? ''}
                      onChange={(e) =>
                        setRemarksById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Add remarks"
                    />
                    <button
                      type="button"
                      className="tech-save-btn"
                      onClick={() => saveRemarks(item.id)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </section>
    </div>
  )
}

function visibleCounts(incidents) {
  return incidents.reduce(
    (acc, item) => {
      const normalized = String(item.status || '').toLowerCase()
      if (normalized === 'resolved') acc.resolved += 1
      else if (normalized === 'in progress') acc.inProgress += 1
      else acc.pending += 1
      return acc
    },
    { pending: 0, inProgress: 0, resolved: 0 },
  )
}

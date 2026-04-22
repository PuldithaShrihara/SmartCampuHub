import { useEffect, useState } from 'react'
import {
  acceptIncidentAssignment,
  declineIncidentAssignment,
  getAllIncidents,
  updateIncident,
} from '../../api/incidentApi.js'
import { useAuth } from '../../context/useAuth.js'
import { useToast } from '../../components/toastContext.js'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

export default function TechnicianTicketsPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [incidents, setIncidents] = useState([])
  const [error, setError] = useState('')
  const [remarksById, setRemarksById] = useState({})
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [onlyMyTickets, setOnlyMyTickets] = useState(false)

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
    <section className="dash-card">
      <h2>Incident Tickets</h2>
      {error ? <div className="dash-msg error">{error}</div> : null}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={onlyMyTickets}
            onChange={(e) => setOnlyMyTickets(e.target.checked)}
          />
          Only my tickets
        </label>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
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
                <td colSpan={8}>No incidents found.</td>
              </tr>
            ) : (
              visibleIncidents.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                  <td>{item.resourceId?.name || '-'}</td>
                  <td>
                    {item.attachmentPath ? (
                      <a href={item.attachmentPath} target="_blank" rel="noreferrer">
                        View file
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{assignedToLabel(item)}</td>
                  <td>
                    {item.assignedTo?.email === user?.email && effectiveAssignmentStatus(item) === 'Assigned' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleAccept(item.id)}
                          disabled={actionLoadingId === item.id}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
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
                      value={remarksById[item.id] ?? item.technicianRemarks ?? ''}
                      onChange={(e) =>
                        setRemarksById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Add remarks"
                    />
                    <button
                      type="button"
                      onClick={() => saveRemarks(item.id)}
                      style={{ marginLeft: 8 }}
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
  )
}

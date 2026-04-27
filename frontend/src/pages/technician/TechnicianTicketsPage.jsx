import { useEffect, useRef, useState } from 'react'
import {
  acceptIncidentAssignment,
  declineIncidentAssignment,
  getAllIncidents,
  updateIncident,
} from '../../api/incidentApi.js'
import { useAuth } from '../../context/useAuth.js'
import '../../styles/TechnicianTicketsPage.css'

function statusClassForBadge(status) {
  const n = String(status || '').toLowerCase()
  if (n === 'resolved') return 'tech-status-badge resolved'
  if (n === 'in progress') return 'tech-status-badge progress'
  if (n === 'closed') return 'tech-status-badge closed'
  if (n === 'rejected') return 'tech-status-badge rejected'
  return 'tech-status-badge pending'
}

function FilterDropdown({ id, label, value, allLabel, options, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const selectedLabel = value || allLabel

  return (
    <div className="tech-ticket-filter" ref={rootRef}>
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className={`tech-filter-btn${open ? ' open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tech-filter-btn__text">{selectedLabel}</span>
        <span className="tech-filter-btn__arrow" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="tech-filter-menu" role="listbox" aria-label={label}>
          <button
            type="button"
            className={`tech-filter-item${value === '' ? ' active' : ''}`}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            role="option"
            aria-selected={value === ''}
          >
            {allLabel}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`tech-filter-item${value === option ? ' active' : ''}`}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              role="option"
              aria-selected={value === option}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function TechnicianTicketsPage() {
  // Logged-in technician data from auth context.
  const { user } = useAuth()
  // All incidents received from backend.
  const [incidents, setIncidents] = useState([])
  // Error text shown at top of page.
  const [error, setError] = useState('')
  // Per-incident typed remarks before saving.
  const [remarksById, setRemarksById] = useState({})
  // Track row currently processing accept/decline/resolve action.
  const [actionLoadingId, setActionLoadingId] = useState('')
  // Optional filter toggle to show only current technician assignments.
  const [onlyMyTickets, setOnlyMyTickets] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Derived counters for status mini badges.
  const statusCounts = visibleCounts(incidents)

  async function loadIncidents() {
    // Method purpose: get incident list for technician view.
    try {
      setError('')
      // Empty status means request all statuses.
      const res = await getAllIncidents('')
      // Defensive API payload validation to avoid runtime crashes on malformed responses.
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    // Initial data load when page opens.
    loadIncidents()
  }, [])

  useEffect(() => {
    // Auto-refresh every 8 seconds to keep assignment/status updates live.
    const intervalId = window.setInterval(() => {
      loadIncidents()
    }, 8000)
    // Cleanup interval on unmount.
    return () => window.clearInterval(intervalId)
  }, [])

  function effectiveAssignmentStatus(item) {
    // Backward-compatibility: legacy records may have assignedTo but missing/old assignmentStatus.
    if (item.assignmentStatus && item.assignmentStatus !== 'Unassigned') {
      return item.assignmentStatus
    }
    return item.assignedTo ? 'Assigned' : 'Unassigned'
  }

  const baseVisibleIncidents = onlyMyTickets
    // Optional operator-focused view: keep only incidents assigned to the logged-in technician.
    ? incidents.filter((item) => item.assignedTo?.email === user?.email)
    : incidents
  const categoryOptions = [...new Set(baseVisibleIncidents.map((item) => String(item.category || '').trim()).filter(Boolean))].sort()
  const priorityOrder = ['Critical', 'High', 'Medium', 'Low']
  const priorityOptions = [...new Set(baseVisibleIncidents.map((item) => String(item.priority || '').trim()).filter(Boolean))].sort(
    (a, b) => {
      const ai = priorityOrder.indexOf(a)
      const bi = priorityOrder.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    },
  )
  const visibleIncidents = baseVisibleIncidents.filter((item) => {
    const category = String(item.category || '').trim()
    const priority = String(item.priority || '').trim()
    if (categoryFilter && category !== categoryFilter) return false
    if (priorityFilter && priority !== priorityFilter) return false
    return true
  })

  async function handleMarkResolved(incidentId) {
    try {
      setActionLoadingId(incidentId)
      setError('')
      const res = await updateIncident(incidentId, { status: 'Resolved' })
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not update status')
      }
      window.alert('Incident marked as resolved.')
      await loadIncidents()
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      setError(err.message || 'Could not update status')
    } finally {
      setActionLoadingId('')
    }
  }

  function validateRemarkInput(rawRemark) {
    // Remove spaces from start and end.
    const trimmedRemark = (rawRemark || '').trim()
    // Must be at least 5 letters/characters.
    if (trimmedRemark.length < 5) {
      return { isValid: false, value: '', message: 'Remark must be at least 5 characters' }
    }
    // Valid remark -> return cleaned text.
    return { isValid: true, value: trimmedRemark, message: '' }
  }

  async function saveRemarks(incidentId) {
    // Save remark for one row.
    // Check input first. If invalid, stop here.
    const validation = validateRemarkInput(remarksById[incidentId])
    if (!validation.isValid) {
      // Show error message.
      setError(validation.message)
      return
    }
    try {
      // Clear old error before saving.
      setError('')
      const res = await updateIncident(incidentId, {
        // Send cleaned remark text.
        technicianRemarks: validation.value,
      })
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not save remarks')
      }
      // Match requested native popup success style.
      window.alert('Remark saved successfully')
      // Load fresh data from backend.
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not save remarks')
    }
  }

  async function handleAccept(incidentId) {
    // Method purpose: technician accepts assigned work.
    try {
      setActionLoadingId(incidentId)
      const res = await acceptIncidentAssignment(incidentId)
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not accept assignment')
      }
      // Match requested native popup success style.
      window.alert('Assignment accepted.')
      // Notify other components (notification badge/dropdowns) about state change.
      window.dispatchEvent(new Event('notifications:changed'))
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not accept assignment')
    } finally {
      setActionLoadingId('')
    }
  }

  function statusCellForRow(item) {
    const mine = item.assignedTo?.email === user?.email
    const assignSt = effectiveAssignmentStatus(item)
    const st = String(item.status || '').toLowerCase()
    const label = item.status || '—'

    if (!mine) {
      return <span className={statusClassForBadge(item.status)}>{label}</span>
    }
    if (assignSt === 'Assigned') {
      return (
        <div className="tech-status-cell">
          <span className="tech-status-badge pending">Open</span>
          <span className="tech-status-hint">Accept assignment to start</span>
        </div>
      )
    }
    if (st === 'resolved') {
      return <span className="tech-status-badge resolved">Resolved</span>
    }
    if (st === 'in progress') {
      return (
        <div className="tech-status-cell tech-status-cell--active">
          <span className="tech-status-badge progress">{item.status || 'In Progress'}</span>
          <button
            type="button"
            className="tech-resolve-btn"
            onClick={() => handleMarkResolved(item.id)}
            disabled={actionLoadingId === item.id}
          >
            Mark resolved
          </button>
        </div>
      )
    }
    return <span className="tech-status-badge pending">{item.status || 'Open'}</span>
  }

  const awaitingAccept = (item) =>
    item.assignedTo?.email === user?.email && effectiveAssignmentStatus(item) === 'Assigned'
  const remarksLocked = (item) =>
    awaitingAccept(item) || String(item.status || '').toLowerCase() === 'resolved'

  async function handleDecline(incidentId) {
    // Method purpose: technician declines assigned work.
    try {
      setActionLoadingId(incidentId)
      const res = await declineIncidentAssignment(incidentId)
      if (res?.success !== true) {
        throw new Error(res?.message || 'Could not decline assignment')
      }
      // Match requested native popup success style.
      window.alert('Assignment declined.')
      // Notify app-level listeners that notification counts may have changed.
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
            <span className="tech-mini-pill pending">Open {statusCounts.pending}</span>
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
          <div className="tech-ticket-filter-group">
            <FilterDropdown
              id="tech-category-filter"
              label="Category"
              value={categoryFilter}
              allLabel="All categories"
              options={categoryOptions}
              onChange={setCategoryFilter}
            />
            <FilterDropdown
              id="tech-priority-filter"
              label="Priority"
              value={priorityFilter}
              allLabel="All priorities"
              options={priorityOptions}
              onChange={setPriorityFilter}
            />
          </div>
          <span className="tech-tickets-meta">{visibleIncidents.length} ticket(s) shown</span>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table tech-tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Attachment</th>
              <th>Assignment</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleIncidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="tech-tickets-empty-state">No incidents found.</td>
              </tr>
            ) : (
              visibleIncidents.map((item) => (
                <tr key={item.id}>
                  <td className="tech-tickets-title-cell">{item.title}</td>
                  <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                  <td>{item.resourceId?.name || '-'}</td>
                  <td>{item.category || <span className="tech-muted">-</span>}</td>
                  <td>{item.priority || <span className="tech-muted">-</span>}</td>
                  <td>
                    {item.attachmentPath ? (
                      <a className="tech-file-link" href={item.attachmentPath} target="_blank" rel="noreferrer">
                        View file
                      </a>
                    ) : (
                      <span className="tech-muted">-</span>
                    )}
                  </td>
                  <td>
                    {/* Accept/Decline is visible only to the assigned technician while assignment is pending. */}
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
                  <td className="tech-status-td">{statusCellForRow(item)}</td>
                  <td>
                    <input
                      className="tech-remarks-input"
                      value={remarksById[item.id] ?? item.technicianRemarks ?? ''}
                      onChange={(e) =>
                        setRemarksById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Add remarks"
                      disabled={remarksLocked(item)}
                    />
                    <button
                      type="button"
                      className="tech-save-btn"
                      onClick={() => saveRemarks(item.id)}
                      disabled={remarksLocked(item)}
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
  // Helper method: count incidents by status for hero badges.
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

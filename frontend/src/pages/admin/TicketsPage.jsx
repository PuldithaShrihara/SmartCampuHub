import { useEffect, useRef, useState } from 'react'
import { FaFilePdf } from 'react-icons/fa'
import { jsPDF } from 'jspdf'
import { adminListTechnicians } from '../../api/auth.js'
import { getAllIncidents, updateIncident } from '../../api/incidentApi.js'
import AdminTicketAnalytics from '../../components/ticket/AdminTicketAnalytics.jsx'
import '../../styles/TicketsPage.css'

const STATUS_OPTIONS = ['Open', 'Resolved', 'Closed', 'Rejected']

function statusClass(status) {
  // Convert any incoming value to lowercase text so comparisons are safe.
  const normalized = String(status || '').toLowerCase()
  // Return CSS class for Resolved status badge.
  if (normalized === 'resolved') return 'ticket-status resolved'
  // Return CSS class for In Progress status badge.
  if (normalized === 'in progress') return 'ticket-status progress'
  if (normalized === 'closed') return 'ticket-status closed'
  if (normalized === 'rejected') return 'ticket-status rejected'
  // Default badge class is Pending.
  return 'ticket-status pending'
}

function priorityClass(priority) {
  const p = String(priority || '').toLowerCase()
  if (p === 'critical') return 'ticket-priority critical'
  if (p === 'high') return 'ticket-priority high'
  if (p === 'medium') return 'ticket-priority medium'
  if (p === 'low') return 'ticket-priority low'
  return 'ticket-priority'
}

function categoryClass(category) {
  if (!category) return 'ticket-category'
  return 'ticket-category'
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
    <div className="tickets-filter" ref={rootRef}>
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className={`tickets-filter-btn${open ? ' open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tickets-filter-btn__text">{selectedLabel}</span>
        <span className="tickets-filter-btn__arrow" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="tickets-filter-menu" role="listbox" aria-label={label}>
          <button
            type="button"
            className={`tickets-filter-item${value === '' ? ' active' : ''}`}
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
              className={`tickets-filter-item${value === option ? ' active' : ''}`}
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

function effectiveAssignmentStatus(item) {
  if (item.assignmentStatus && item.assignmentStatus !== 'Unassigned') {
    return item.assignmentStatus
  }
  return item.assignedTo ? 'Assigned' : 'Unassigned'
}

function statusFlowHint(item) {
  const st = String(item.status || '').toLowerCase()
  const assign = effectiveAssignmentStatus(item)
  if (st === 'open' && assign === 'Assigned') {
    return 'Waiting for technician to accept'
  }
  if (st === 'in progress') {
    return 'Technician has accepted; work in progress'
  }
  if (st === 'resolved') {
    return 'Ready for closure'
  }
  if (st === 'closed') {
    return 'Closed'
  }
  if (st === 'rejected') {
    return 'Rejected by admin'
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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
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
  const categoryOptions = [...new Set(incidents.map((item) => String(item.category || '').trim()).filter(Boolean))].sort()
  const priorityOrder = ['Critical', 'High', 'Medium', 'Low']
  const priorityOptions = [...new Set(incidents.map((item) => String(item.priority || '').trim()).filter(Boolean))].sort(
    (a, b) => {
      const ai = priorityOrder.indexOf(a)
      const bi = priorityOrder.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    },
  )
  const visibleIncidents = incidents.filter((item) => {
    const category = String(item.category || '').trim()
    const priority = String(item.priority || '').trim()
    if (categoryFilter && category !== categoryFilter) return false
    if (priorityFilter && priority !== priorityFilter) return false
    return true
  })
  const generatedOn = new Date().toLocaleString('en-US')

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 42
    const usableWidth = pageWidth - margin * 2
    let y = margin

    const colors = {
      brand: [79, 70, 229],
      textPrimary: [15, 23, 42],
      textSecondary: [71, 85, 105],
      border: [203, 213, 225],
      cardBg: [248, 250, 252],
      white: [255, 255, 255],
    }

    const setTextColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2])

    const addPageFooter = () => {
      const footerY = pageHeight - 20
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setTextColor(colors.textSecondary)
      doc.text(`Generated ${generatedOn}`, margin, footerY)
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY, { align: 'right' })
      setTextColor(colors.textPrimary)
    }

    const ensurePageSpace = (requiredHeight = 22) => {
      if (y + requiredHeight <= pageHeight - margin) return
      addPageFooter()
      doc.addPage()
      y = margin
      drawHeader(true)
    }

    const drawHeader = (isContinuation = false) => {
      const headerHeight = 74
      doc.setFillColor(colors.brand[0], colors.brand[1], colors.brand[2])
      doc.roundedRect(margin, y, usableWidth, headerHeight, 10, 10, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      setTextColor(colors.white)
      doc.text(isContinuation ? 'Incident Tickets Report (continued)' : 'Incident Tickets Report', margin + 16, y + 30)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Status filter: ${statusFilter || 'All'}`, margin + 16, y + 50)
      doc.text(
        `Category: ${categoryFilter || 'All'} | Priority: ${priorityFilter || 'All'}`,
        margin + 16,
        y + 64
      )
      doc.text(`Prepared: ${generatedOn}`, pageWidth - margin - 16, y + 50, { align: 'right' })

      setTextColor(colors.textPrimary)
      y += headerHeight + 16
    }

    const addSectionTitle = (title) => {
      ensurePageSpace(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12.5)
      setTextColor(colors.textPrimary)
      doc.text(title, margin, y)
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.line(margin, y + 8, pageWidth - margin, y + 8)
      y += 22
    }

    const addKpiRow = (leftLabel, leftValue, rightLabel, rightValue) => {
      const cardGap = 12
      const cardWidth = (usableWidth - cardGap) / 2
      const cardHeight = 54
      ensurePageSpace(cardHeight + 10)

      ;[
        { x: margin, label: leftLabel, value: leftValue },
        { x: margin + cardWidth + cardGap, label: rightLabel, value: rightValue },
      ].forEach((item) => {
        doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2])
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
        doc.roundedRect(item.x, y, cardWidth, cardHeight, 7, 7, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        setTextColor(colors.textSecondary)
        doc.text(String(item.label).toUpperCase(), item.x + 10, y + 18)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        setTextColor(colors.textPrimary)
        const val = doc.splitTextToSize(String(item.value), cardWidth - 20)
        doc.text(val[0] || '-', item.x + 10, y + 38)
      })

      y += cardHeight + 10
    }

    const safe = (value) => {
      const text = String(value ?? '').trim()
      return text.length ? text : '-'
    }

    const tableColumns = [
      { key: 'title', label: 'Title', width: 120 },
      { key: 'user', label: 'User', width: 80 },
      { key: 'resource', label: 'Resource', width: 75 },
      { key: 'category', label: 'Category', width: 60 },
      { key: 'priority', label: 'Priority', width: 50 },
      { key: 'status', label: 'Status', width: 50 },
      { key: 'assigned', label: 'Technician', width: 64 },
    ]

    const drawTableHeader = () => {
      ensurePageSpace(26)
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.rect(margin, y, usableWidth, 22, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      setTextColor(colors.textPrimary)
      let x = margin + 6
      tableColumns.forEach((col) => {
        doc.text(col.label, x, y + 15)
        x += col.width
      })

      y += 22
    }

    const drawRow = (row) => {
      const rowHeight = 34
      ensurePageSpace(rowHeight + 4)

      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.rect(margin, y, usableWidth, rowHeight)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.2)
      setTextColor(colors.textSecondary)

      let x = margin + 6
      const maxLineWidthPadding = 12
      tableColumns.forEach((col) => {
        const text = safe(row[col.key])
        const lines = doc.splitTextToSize(text, col.width - maxLineWidthPadding)
        doc.text(String(lines[0] || '-'), x, y + 14)
        if (lines[1]) {
          doc.text(String(lines[1]), x, y + 26)
        }
        x += col.width
      })

      y += rowHeight
      setTextColor(colors.textPrimary)
    }

    drawHeader(false)

    addSectionTitle('Summary')
    addKpiRow('Total tickets (all)', incidents.length, 'Tickets in view (filtered)', visibleIncidents.length)
    addKpiRow('Open', statusCounts.pending, 'In progress', statusCounts.inProgress)
    addKpiRow('Resolved', statusCounts.resolved, 'Generated on', new Date().toISOString().slice(0, 10))

    addSectionTitle('Tickets List')
    drawTableHeader()

    if (!visibleIncidents.length) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10.5)
      setTextColor(colors.textSecondary)
      doc.text('No incidents found for the selected filters.', margin, y + 10)
      y += 18
    } else {
      visibleIncidents.forEach((item) => {
        const assignedText =
          typeof item.assignedTo === 'object'
            ? item.assignedTo?.fullName || item.assignedTo?.email || '-'
            : item.assignedTo
              ? 'Assigned'
              : '-'
        drawRow({
          title: safe(item.title),
          user: safe(item.userId?.fullName || item.userId?.email),
          resource: safe(item.resourceId?.name),
          category: safe(item.category),
          priority: safe(item.priority),
          status: safe(item.status),
          assigned: safe(assignedText),
        })
      })
    }

    addPageFooter()
    doc.save(`admin-incidents-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

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
            <span className="mini-pill pending">Open {statusCounts.pending}</span>
            <span className="mini-pill progress">In Progress {statusCounts.inProgress}</span>
            <span className="mini-pill resolved">Resolved {statusCounts.resolved}</span>
          </div>
        </div>
      </section>

      <AdminTicketAnalytics incidents={incidents} />

      <section className="dash-card tickets-table-card" style={{ marginTop: '24px' }}>
      {error ? <div className="dash-msg error">{error}</div> : null}

      <div className="tickets-toolbar">
        <FilterDropdown
          id="ticket-status-filter"
          label="Filter by status"
          value={statusFilter}
          allLabel="All"
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          id="ticket-category-filter"
          label="Filter by category"
          value={categoryFilter}
          allLabel="All categories"
          options={categoryOptions}
          onChange={setCategoryFilter}
        />
        <FilterDropdown
          id="ticket-priority-filter"
          label="Filter by priority"
          value={priorityFilter}
          allLabel="All priorities"
          options={priorityOptions}
          onChange={setPriorityFilter}
        />
        <button
          type="button"
          className="tickets-pdf-btn"
          onClick={handleDownloadPdf}
          disabled={loading}
          title="Generate a PDF report for the current view"
        >
          <FaFilePdf aria-hidden />
          Generate PDF
        </button>
        <span className="tickets-meta">
          {loading
            ? 'Loading incidents...'
            : loadingTechnicians
              ? `Refreshing availability... ${visibleIncidents.length} ticket(s) found`
              : `${visibleIncidents.length} ticket(s) found`}
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
              <th>Category</th>
              <th>Priority</th>
              <th>Attachment</th>
              <th>Status</th>
              <th>Assigned technician</th>
              <th>Technician Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleIncidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="tickets-empty-state">
                  No incidents found.
                </td>
              </tr>
            ) : (
              visibleIncidents.map((item) => {
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
                const normalizedStatus = String(item.status || '').toLowerCase()
                const normalizedAssignmentStatus = String(item.assignmentStatus || '').toLowerCase()
                const assignmentLocked =
                  normalizedStatus === 'resolved' ||
                  normalizedStatus === 'closed' ||
                  normalizedStatus === 'rejected' ||
                  normalizedAssignmentStatus === 'accepted'
                const statusHint = statusFlowHint(item)
                return (
                  <tr key={item.id}>
                    <td className="tickets-title-cell" title={item.title || '-'}>
                      <span className="tickets-cell-ellipsis">{item.title || '-'}</span>
                    </td>
                    <td title={item.userId?.fullName || item.userId?.email || '-'}>
                      <span className="tickets-cell-ellipsis">{item.userId?.fullName || item.userId?.email || '-'}</span>
                    </td>
                    <td title={item.resourceId?.name || '-'}>
                      <span className="tickets-cell-ellipsis">{item.resourceId?.name || '-'}</span>
                    </td>
                    <td>
                      {item.category ? (
                        <span className={categoryClass(item.category)}>{item.category}</span>
                      ) : (
                        <span className="tickets-muted">-</span>
                      )}
                    </td>
                    <td>
                      {item.priority ? (
                        <span className={priorityClass(item.priority)}>{item.priority}</span>
                      ) : (
                        <span className="tickets-muted">-</span>
                      )}
                    </td>
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
                        disabled={assigningId === item.id || assignmentLocked}
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
                    <td title={item.technicianRemarks || '-'}>
                      {item.technicianRemarks ? (
                        <span className="tickets-cell-ellipsis">{item.technicianRemarks}</span>
                      ) : (
                        <span className="tickets-muted">-</span>
                      )}
                    </td>
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

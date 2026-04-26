import { useEffect, useRef, useState } from 'react'
import { createIncident, deleteMyIncident, getMyIncidents, updateMyIncident } from '../../api/incidentApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import { useToast } from '../../components/toastContext.js'
import { useAuth } from '../../context/useAuth.js'
import '../../styles/StudentIncidentsPage.css'

function statusClass(status) {
  // Convert incoming status to normalized lowercase text.
  const normalized = String(status || '').toLowerCase()
  // If status is resolved, return resolved badge class.
  if (normalized === 'resolved') return 'incident-status resolved'
  // If status is in progress, return in-progress badge class.
  if (normalized === 'in progress') return 'incident-status progress'
  // For any other value (including empty), use pending style.
  return 'incident-status pending'
}

function getStatusCounts(incidents) {
  // Reduce full incidents list into three counters for dashboard pills.
  return incidents.reduce(
    (acc, item) => {
      // Read current row status safely.
      const key = String(item.status || '').toLowerCase()
      // Increase matching status count.
      if (key === 'resolved') acc.resolved += 1
      else if (key === 'in progress') acc.inProgress += 1
      else acc.pending += 1
      // Return updated accumulator for next row.
      return acc
    },
    // Initial counter values before scanning the list.
    { pending: 0, inProgress: 0, resolved: 0 }
  )
}

export default function StudentIncidentsPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf']
  const maxFileSizeBytes = 2 * 1024 * 1024
  // Reference to "My Incidents" section for smooth scroll after successful submit.
  const incidentsListRef = useRef(null)
  // Reference to file input so we can clear native chosen file text.
  const fileInputRef = useRef(null)
  // Form fields for creating/updating incidents.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [file, setFile] = useState(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [errors, setErrors] = useState({})
  // Common UI states.
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Data lists for table and dropdown.
  const [incidents, setIncidents] = useState([])
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  // If not null, form is in "edit existing incident" mode.
  const [editingIncidentId, setEditingIncidentId] = useState(null)
  // Object URL for image preview.
  const [filePreviewUrl, setFilePreviewUrl] = useState('')
  // Derived values used in UI.
  const statusCounts = getStatusCounts(incidents)
  const isImageFile = Boolean(file?.type?.startsWith('image/'))
  const isPdfFile = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')

  function clearSelectedFile() {
    // Clear React state.
    setFile(null)
    if (fileInputRef.current) {
      // Also clear browser native file input value.
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    // If no image file is selected, clear preview URL.
    if (!file || !isImageFile) {
      setFilePreviewUrl('')
      return
    }
    // Create local browser URL to preview selected image.
    const objectUrl = URL.createObjectURL(file)
    setFilePreviewUrl(objectUrl)
    return () => {
      // Free memory when file changes or component unmounts.
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, isImageFile])

  useEffect(() => {
    // Auto-fill identity fields from logged-in user session data.
    setFullName(user?.fullName || '')
    setEmail(user?.email || '')
  }, [user])

  async function loadMyIncidents() {
    // Method purpose: fetch incidents created by logged-in student.
    try {
      const res = await getMyIncidents()
      // Array-safe response handling.
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    // Initial page data load: student's incidents + available resources.
    loadMyIncidents()
    loadResources()
  }, [])

  async function loadResources() {
    // Method purpose: fetch resources for incident dropdown.
    try {
      setResourcesLoading(true)
      const res = await fetchResources()
      // Support multiple backend response shapes safely.
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.content)
            ? res.content
            : []
      setResources(list)
    } catch (err) {
      setError(err.message || 'Could not load resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  function validateForm() {
    // Collect every field validation error first; submit only when object stays empty.
    const nextErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Validation A: title must be descriptive enough for technician triage.
    if (title.trim().length < 10) {
      nextErrors.title = 'Title must be at least 10 characters'
    }
    // Validation B: description should include enough detail for faster resolution.
    if (description.trim().length < 20) {
      nextErrors.description = 'Description must be at least 20 characters'
    }
    // Validation C: email must remain a valid contact value.
    if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address'
    }
    // Validation D: user must explicitly choose a resource (default option is empty).
    if (!resourceId.trim()) {
      nextErrors.resourceId = 'Please select a resource'
    }
    // Validation E: optional attachment must match allowed types/size before upload.
    if (file && !allowedFileTypes.includes(file.type)) {
      nextErrors.file = 'Only image or PDF files are allowed'
    } else if (file && file.size > maxFileSizeBytes) {
      nextErrors.file = 'File size must be less than 2MB'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    // Stop browser default form submission so React can handle async flow.
    event.preventDefault()
    // Reset old alerts before starting action.
    setError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      if (editingIncidentId) {
        // Student-side validation rule: only metadata update here; attachment edits are intentionally blocked.
        await updateMyIncident(editingIncidentId, {
          // Trim spaces to avoid accidental whitespace-only values.
          title: title.trim(),
          description: description.trim(),
          resourceId: resourceId.trim(),
        })
        setTitle('')
        setDescription('')
        setResourceId('')
        // Remove any selected file while leaving edit mode.
        clearSelectedFile()
        setEditingIncidentId(null)
        // Show success feedback using app toast popup (instead of browser alert).
        pushToast({ type: 'success', message: 'Incident updated successfully.' })
      } else {
        // Create new incident with optional attachment.
        const response = await createIncident({
          title: title.trim(),
          description: description.trim(),
          resourceId: resourceId.trim(),
          file,
        })
        // Only treat as success when API contract explicitly confirms success=true.
        if (response?.success !== true) {
          throw new Error(response?.message || 'Could not submit incident')
        }
        // Keep submit feedback only in page message area (no duplicate toast).
        // Tell notification widgets/badges to refresh.
        window.dispatchEvent(new Event('notifications:changed'))
        setTitle('')
        setDescription('')
        setResourceId('')
        // Clear selected file from state and native input.
        clearSelectedFile()
        setEditingIncidentId(null)
        // Show success feedback using app toast popup (instead of browser alert).
        pushToast({ type: 'success', message: 'Incident submitted successfully.' })
      }
      // Reload incident table after create/update.
      await loadMyIncidents()
      if (!editingIncidentId) {
        // After new submit, auto-scroll user to incidents list section.
        incidentsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (err) {
      setError(err.message || (editingIncidentId ? 'Could not update incident' : 'Could not submit incident'))
    } finally {
      setLoading(false)
    }
  }

  function startEditIncident(item) {
    // Business rule: student can edit only while the incident is still pending.
    if (String(item.status || '').toLowerCase() !== 'pending') return
    setEditingIncidentId(item.id)
    // Copy selected row values into form inputs.
    setTitle(item.title || '')
    setDescription(item.description || '')
    setResourceId(item.resourceId?.id || item.resourceId || '')
    clearSelectedFile()
    setError('')
  }

  function cancelEdit() {
    // Return form to create mode and clear transient UI state.
    setEditingIncidentId(null)
    setTitle('')
    setDescription('')
    setResourceId(resources.length > 0 ? resources[0].id : '')
    clearSelectedFile()
    setError('')
  }

  function handleRemoveAttachment() {
    // Local-only UI action: no backend call needed before submit.
    if (!file) return
    // Remove selected file and show confirmation.
    clearSelectedFile()
    // Show success feedback using app toast popup.
    pushToast({ type: 'success', message: 'Attachment removed successfully.' })
  }

  async function handleDeleteIncident(item) {
    // Business rule mirrors backend guard: only pending incidents can be deleted by student.
    if (String(item.status || '').toLowerCase() !== 'pending') return
    const confirmed = window.confirm('Delete this pending incident? This action cannot be undone.')
    // Stop here if user cancels the confirmation dialog.
    if (!confirmed) return

    setError('')
    setLoading(true)
    try {
      // Delete request for selected incident id.
      await deleteMyIncident(item.id)
      if (editingIncidentId === item.id) {
        // If deleted row was being edited, reset edit form.
        cancelEdit()
      }
      // Show success feedback using app toast popup.
      pushToast({ type: 'success', message: 'Incident deleted successfully.' })
      await loadMyIncidents()
    } catch (err) {
      setError(err.message || 'Could not delete incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="incident-page">
      {/* Hero card: title + quick counters (Pending/In Progress/Resolved). */}
      <section className="dash-card incident-hero">
        <div className="incident-hero-copy">
          <h2>Report an Incident</h2>
          <p>Submit issues quickly and track updates from technicians.</p>
        </div>
        <div className="incident-count-grid">
          <div className="incident-count">
            <span>Total tickets</span>
            <strong>{incidents.length}</strong>
          </div>
          <div className="incident-mini-badges">
            <span className="mini-pill pending">Pending {statusCounts.pending}</span>
            <span className="mini-pill progress">In Progress {statusCounts.inProgress}</span>
            <span className="mini-pill resolved">Resolved {statusCounts.resolved}</span>
          </div>
        </div>
      </section>

      {/* Form card: create new incident or edit pending one. */}
      <section className="dash-card incident-form-card">
        {/* Error message from API failures. */}
        {error ? <div className="dash-msg error">{error}</div> : null}

        {/* onSubmit calls handleSubmit() for create/update workflow. */}
        <form className="incident-form-grid" onSubmit={handleSubmit}>
          <div className="incident-field">
            <label htmlFor="incident-full-name">Full Name</label>
            <input
              id="incident-full-name"
              value={fullName}
              readOnly
              placeholder="Full name"
            />
          </div>
          <div className="incident-field">
            <label htmlFor="incident-email">Email</label>
            <input
              id="incident-email"
              className={errors.email ? 'incident-input-error' : ''}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@my.sliit.lk"
              required
            />
            {errors.email ? <small className="incident-field-error">{errors.email}</small> : null}
          </div>
          <div className="incident-field">
            <label htmlFor="incident-title">Title</label>
            <input
              id="incident-title"
              className={errors.title ? 'incident-input-error' : ''}
              // Controlled input value from component state.
              value={title}
              // Keep state in sync with user typing.
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Projector is not working"
              // HTML required validation before submit.
              required
            />
            {errors.title ? <small className="incident-field-error">{errors.title}</small> : null}
          </div>
          <div className="incident-field">
            <label htmlFor="incident-description">Description</label>
            <textarea
              id="incident-description"
              className={errors.description ? 'incident-input-error' : ''}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly so technicians can help faster."
              required
            />
            {errors.description ? <small className="incident-field-error">{errors.description}</small> : null}
          </div>
          {/* Row with resource selector + optional file upload. */}
          <div className="incident-form-row">
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-resource">Resource</label>
              <select
                id="incident-resource"
                className={errors.resourceId ? 'incident-input-error' : ''}
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                required
                // Disable when resources are loading or unavailable.
                disabled={resourcesLoading || resources.length === 0}
              >
                <option value="">
                  {resourcesLoading ? 'Loading resources...' : resources.length === 0 ? 'No resources found' : 'Select a resource'}
                </option>
                {/* Normal case: show all resource options. */}
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.location || resource.id})
                  </option>
                ))}
              </select>
              {errors.resourceId ? <small className="incident-field-error">{errors.resourceId}</small> : null}
            </div>
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-file">Attachment (optional)</label>
              <input
                ref={fileInputRef}
                id="incident-file"
                className={errors.file ? 'incident-input-error' : ''}
                type="file"
                // Allow only image or PDF file types from file picker.
                accept="image/*,.pdf"
                // Store first selected file object in state.
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                // Business rule: attachment update disabled in edit mode.
                disabled={Boolean(editingIncidentId)}
              />
              <small>
                {/* Context text changes based on mode and selected file. */}
                {editingIncidentId
                  ? 'Attachment update is disabled while editing.'
                  : file
                    ? `Selected: ${file.name}`
                    : 'Supported: image, pdf'}
              </small>
              {errors.file ? <small className="incident-field-error">{errors.file}</small> : null}
              {!editingIncidentId && file ? (
                // Preview block appears only for create mode with selected file.
                <div className="incident-attachment-preview">
                  <button
                    type="button"
                    className="incident-attachment-remove"
                    onClick={handleRemoveAttachment}
                    aria-label="Remove selected attachment"
                    title="Remove attachment"
                  >
                    ×
                  </button>
                  {/* Show image preview when selected file is an image. */}
                  {isImageFile && filePreviewUrl ? (
                    <>
                      <img src={filePreviewUrl} alt="Attachment preview" className="incident-attachment-image" />
                      <span className="incident-attachment-label">Image preview</span>
                    </>
                  ) : isPdfFile ? (
                    // Show PDF label/card when selected file is PDF.
                    <div className="incident-attachment-pdf">
                      <span className="incident-pdf-icon">PDF</span>
                      <span className="incident-attachment-label">{file.name}</span>
                    </div>
                  ) : (
                    // Generic filename fallback for other accepted types.
                    <span className="incident-attachment-label">{file.name}</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Main submit button switches text by mode and loading state. */}
          <button className="incident-submit-btn" type="submit" disabled={loading}>
            {loading ? (editingIncidentId ? 'Updating...' : 'Submitting...') : editingIncidentId ? 'Update Incident' : 'Submit Incident'}
          </button>
          {/* Cancel button appears only in edit mode. */}
          {editingIncidentId ? (
            <button className="incident-submit-btn incident-cancel-btn" type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          ) : null}
        </form>
      </section>

      {/* Table card: shows all incidents created by current student. */}
      <section ref={incidentsListRef} className="dash-card incident-table-card">
        <h2>My Incidents</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Resource</th>
                <th>Remarks</th>
                  <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty-state row when no incidents exist. */}
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="incident-empty-state">
                    No incidents yet. Submit your first incident above.
                  </td>
                </tr>
              ) : (
                // Render one row per incident.
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>
                      {/* Colored status badge: Pending / In Progress / Resolved. */}
                      <span className={statusClass(item.status)}>{item.status}</span>
                    </td>
                    <td>{item.resourceId?.name || item.resourceId || '-'}</td>
                    <td>{item.technicianRemarks || '-'}</td>
                    <td>
                      {/* Business rule: edit/delete allowed only while status is pending. */}
                      {String(item.status || '').toLowerCase() === 'pending' ? (
                        <div className="incident-action-group">
                          <button
                            type="button"
                            className="incident-row-edit-btn"
                            onClick={() => startEditIncident(item)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="incident-row-delete-btn"
                            onClick={() => handleDeleteIncident(item)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
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

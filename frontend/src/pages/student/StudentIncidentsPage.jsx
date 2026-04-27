import { useEffect, useRef, useState } from 'react'
import { createIncident, deleteMyIncident, getMyIncidents, updateMyIncident } from '../../api/incidentApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import { useAuth } from '../../context/useAuth.js'
import '../../styles/StudentIncidentsPage.css'

const CATEGORY_OPTIONS = ['Electrical', 'Network', 'Hardware', 'Facility', 'Safety', 'Other']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

function statusClass(status) {
  // Convert incoming status to normalized lowercase text.
  const normalized = String(status || '').toLowerCase()
  // If status is resolved, return resolved badge class.
  if (normalized === 'resolved') return 'incident-status resolved'
  // If status is in progress, return in-progress badge class.
  if (normalized === 'in progress') return 'incident-status progress'
  if (normalized === 'closed') return 'incident-status resolved'
  if (normalized === 'rejected') return 'incident-status rejected'
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
  const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxFileSizeBytes = 2 * 1024 * 1024
  // Reference to "My Incidents" section for smooth scroll after successful submit.
  const incidentsListRef = useRef(null)
  // Reference to file input so we can clear native chosen file text.
  const fileInputRef = useRef(null)
  // Form fields for creating/updating incidents.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [resourceId, setResourceId] = useState('')
  const [files, setFiles] = useState([])
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
  const [filePreviewUrls, setFilePreviewUrls] = useState([])
  // Derived values used in UI.
  const statusCounts = getStatusCounts(incidents)
  const hasAttachments = files.length > 0

  function clearSelectedFile() {
    // Clear React state.
    setFiles([])
    if (fileInputRef.current) {
      // Also clear browser native file input value.
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!files.length) {
      setFilePreviewUrls([])
      return
    }
    const objectUrls = files.map((selectedFile) => URL.createObjectURL(selectedFile))
    setFilePreviewUrls(objectUrls)
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

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
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter a valid contact name'
    }
    if (!category.trim()) {
      nextErrors.category = 'Please select a category'
    }
    if (!priority.trim()) {
      nextErrors.priority = 'Please select a priority'
    }
    // Validation D: user must explicitly choose a resource (default option is empty).
    if (!resourceId.trim()) {
      nextErrors.resourceId = 'Please select a resource'
    }
    // Validation E: optional attachment must match allowed types/size before upload.
    if (files.length > 3) {
      nextErrors.file = 'Maximum 3 image attachments are allowed'
    } else if (files.some((file) => !allowedFileTypes.includes(file.type))) {
      nextErrors.file = 'Only image attachments are allowed (jpeg, png, webp, gif)'
    } else if (files.some((file) => file.size > maxFileSizeBytes)) {
      nextErrors.file = 'Each file size must be less than 2MB'
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
          category: category.trim(),
          priority: priority.trim(),
          resourceId: resourceId.trim(),
          preferredContactName: fullName.trim(),
          preferredContactEmail: email.trim(),
        })
        setTitle('')
        setDescription('')
        setCategory('')
        setPriority('Medium')
        setResourceId('')
        // Remove any selected file while leaving edit mode.
        clearSelectedFile()
        setEditingIncidentId(null)
        window.alert('Incident updated successfully.')
      } else {
        // Create new incident with optional attachment.
        const response = await createIncident({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          priority: priority.trim(),
          resourceId: resourceId.trim(),
          preferredContactName: fullName.trim(),
          preferredContactEmail: email.trim(),
          files,
        })
        // Only treat as success when API contract explicitly confirms success=true.
        if (response?.success !== true) {
          throw new Error(response?.message || 'Could not submit incident')
        }
        // Do not trigger global notification popup flow after submit.
        // (User wants only one submit success message.)
        setTitle('')
        setDescription('')
        setCategory('')
        setPriority('Medium')
        setResourceId('')
        // Clear selected file from state and native input.
        clearSelectedFile()
        setEditingIncidentId(null)
        window.alert('Incident submitted successfully.')
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
    // Business rule: student can edit only while the incident is still open.
    if (String(item.status || '').toLowerCase() !== 'open') return
    setEditingIncidentId(item.id)
    // Copy selected row values into form inputs.
    setTitle(item.title || '')
    setDescription(item.description || '')
    setCategory(item.category || '')
    setPriority(item.priority || 'Medium')
    setResourceId(item.resourceId?.id || item.resourceId || '')
    setFullName(item.preferredContactName || user?.fullName || '')
    setEmail(item.preferredContactEmail || user?.email || '')
    clearSelectedFile()
    setError('')
  }

  function cancelEdit() {
    // Return form to create mode and clear transient UI state.
    setEditingIncidentId(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setPriority('Medium')
    setResourceId(resources.length > 0 ? resources[0].id : '')
    setFullName(user?.fullName || '')
    setEmail(user?.email || '')
    clearSelectedFile()
    setError('')
  }

  function handleRemoveAttachment() {
    // Local-only UI action: no backend call needed before submit.
    if (!files.length) return
    // Remove selected file and show confirmation.
    clearSelectedFile()
    window.alert('Attachment removed successfully.')
  }

  async function handleDeleteIncident(item) {
    // Business rule mirrors backend guard: only open incidents can be deleted by student.
    if (String(item.status || '').toLowerCase() !== 'open') return
    const confirmed = window.confirm('Delete this open incident? This action cannot be undone.')
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
      // Keep delete flow like native confirm dialog style: no extra success toast popup.
      await loadMyIncidents()
    } catch (err) {
      setError(err.message || 'Could not delete incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="incident-page">
      {/* Hero card: title + quick counters (Open/In Progress/Resolved). */}
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
            <span className="mini-pill pending">Open {statusCounts.pending}</span>
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
              className={errors.fullName ? 'incident-input-error' : ''}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              required
            />
            {errors.fullName ? <small className="incident-field-error">{errors.fullName}</small> : null}
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
          <div className="incident-form-row">
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-category">Category</label>
              <select
                id="incident-category"
                className={errors.category ? 'incident-input-error' : ''}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.category ? <small className="incident-field-error">{errors.category}</small> : null}
            </div>
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-priority">Priority</label>
              <select
                id="incident-priority"
                className={errors.priority ? 'incident-input-error' : ''}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.priority ? <small className="incident-field-error">{errors.priority}</small> : null}
            </div>
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
                // Allow up to 3 image evidence files.
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
                // Business rule: attachment update disabled in edit mode.
                disabled={Boolean(editingIncidentId)}
              />
              <small>
                {/* Context text changes based on mode and selected file. */}
                {editingIncidentId
                  ? 'Attachment update is disabled while editing.'
                  : hasAttachments
                    ? `Selected ${files.length} image${files.length === 1 ? '' : 's'}`
                    : 'Supported: jpeg, png, webp, gif (max 3)'}
              </small>
              {errors.file ? <small className="incident-field-error">{errors.file}</small> : null}
              {!editingIncidentId && hasAttachments ? (
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
                  <div className="incident-attachment-grid">
                    {files.map((selectedFile, index) => (
                      <div key={`${selectedFile.name}-${index}`} className="incident-attachment-thumb-wrap">
                        <img
                          src={filePreviewUrls[index]}
                          alt={`Attachment ${index + 1}`}
                          className="incident-attachment-image"
                        />
                        <span className="incident-attachment-label">{selectedFile.name}</span>
                      </div>
                    ))}
                  </div>
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
                <th>Category</th>
                <th>Priority</th>
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
                  <td colSpan={7} className="incident-empty-state">
                    No incidents yet. Submit your first incident above.
                  </td>
                </tr>
              ) : (
                // Render one row per incident.
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.priority || '-'}</td>
                    <td>
                      {/* Colored status badge: Pending / In Progress / Resolved. */}
                      <span className={statusClass(item.status)}>{item.status}</span>
                    </td>
                    <td>{item.resourceId?.name || item.resourceId || '-'}</td>
                    <td>{item.technicianRemarks || '-'}</td>
                    <td>
                      {/* Business rule: edit/delete allowed only while status is open. */}
                      {String(item.status || '').toLowerCase() === 'open' ? (
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

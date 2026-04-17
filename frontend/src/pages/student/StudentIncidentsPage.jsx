import { useEffect, useState } from 'react'
import { createIncident, deleteMyIncident, getMyIncidents, updateMyIncident } from '../../api/incidentApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import '../../styles/StudentIncidentsPage.css'

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'resolved') return 'incident-status resolved'
  if (normalized === 'in progress') return 'incident-status progress'
  return 'incident-status pending'
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

export default function StudentIncidentsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [incidents, setIncidents] = useState([])
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [editingIncidentId, setEditingIncidentId] = useState(null)
  const statusCounts = getStatusCounts(incidents)

  async function loadMyIncidents() {
    try {
      const res = await getMyIncidents()
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    loadMyIncidents()
    loadResources()
  }, [])

  async function loadResources() {
    try {
      setResourcesLoading(true)
      const res = await fetchResources()
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.content)
            ? res.content
            : []
      setResources(list)
      if (!resourceId && list.length > 0) {
        setResourceId(list[0].id)
      }
    } catch (err) {
      setError(err.message || 'Could not load resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (editingIncidentId) {
        await updateMyIncident(editingIncidentId, {
          title: title.trim(),
          description: description.trim(),
          resourceId: resourceId.trim(),
        })
      } else {
        await createIncident({
          title: title.trim(),
          description: description.trim(),
          resourceId: resourceId.trim(),
          file,
        })
      }
      setTitle('')
      setDescription('')
      setResourceId('')
      setFile(null)
      setEditingIncidentId(null)
      setMessage(editingIncidentId ? 'Incident updated successfully.' : 'Incident submitted successfully.')
      await loadMyIncidents()
    } catch (err) {
      setError(err.message || (editingIncidentId ? 'Could not update incident' : 'Could not submit incident'))
    } finally {
      setLoading(false)
    }
  }

  function startEditIncident(item) {
    if (String(item.status || '').toLowerCase() !== 'pending') return
    setEditingIncidentId(item.id)
    setTitle(item.title || '')
    setDescription(item.description || '')
    setResourceId(item.resourceId?.id || item.resourceId || '')
    setFile(null)
    setMessage('')
    setError('')
  }

  function cancelEdit() {
    setEditingIncidentId(null)
    setTitle('')
    setDescription('')
    setResourceId(resources.length > 0 ? resources[0].id : '')
    setFile(null)
    setMessage('')
    setError('')
  }

  async function handleDeleteIncident(item) {
    if (String(item.status || '').toLowerCase() !== 'pending') return
    const confirmed = window.confirm('Delete this pending incident? This action cannot be undone.')
    if (!confirmed) return

    setError('')
    setMessage('')
    setLoading(true)
    try {
      await deleteMyIncident(item.id)
      if (editingIncidentId === item.id) {
        cancelEdit()
      }
      setMessage('Incident deleted successfully.')
      await loadMyIncidents()
    } catch (err) {
      setError(err.message || 'Could not delete incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="incident-page">
      <section className="dash-card incident-hero">
        <div className="incident-hero-copy">
          <h2>Report an Incident</h2>
          <p>Create and track issues related to campus resources.</p>
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

      <section className="dash-card incident-form-card">
        {message ? <div className="dash-msg success">{message}</div> : null}
        {error ? <div className="dash-msg error">{error}</div> : null}

        <form className="incident-form-grid" onSubmit={handleSubmit}>
          <div className="incident-field">
            <label htmlFor="incident-title">Title</label>
            <input
              id="incident-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Projector is not working"
              required
            />
          </div>
          <div className="incident-field">
            <label htmlFor="incident-description">Description</label>
            <textarea
              id="incident-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly so technicians can help faster."
              required
            />
          </div>
          <div className="incident-form-row">
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-resource">Resource</label>
              <select
                id="incident-resource"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                required
                disabled={resourcesLoading || resources.length === 0}
              >
                {resources.length === 0 ? (
                  <option value="">
                    {resourcesLoading ? 'Loading resources...' : 'No resources found'}
                  </option>
                ) : (
                  resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.location || resource.id})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="incident-field incident-field-half">
              <label htmlFor="incident-file">Attachment (optional)</label>
              <input
                id="incident-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={Boolean(editingIncidentId)}
              />
              <small>
                {editingIncidentId
                  ? 'Attachment update is disabled while editing.'
                  : file
                    ? `Selected: ${file.name}`
                    : 'Supported: image, pdf'}
              </small>
            </div>
          </div>

          <button className="incident-submit-btn" type="submit" disabled={loading}>
            {loading ? (editingIncidentId ? 'Updating...' : 'Submitting...') : editingIncidentId ? 'Update Incident' : 'Submit Incident'}
          </button>
          {editingIncidentId ? (
            <button className="incident-submit-btn incident-cancel-btn" type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          ) : null}
        </form>
      </section>

      <section className="dash-card incident-table-card">
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
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="incident-empty-state">
                    No incidents yet. Submit your first incident above.
                  </td>
                </tr>
              ) : (
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>
                      <span className={statusClass(item.status)}>{item.status}</span>
                    </td>
                    <td>{item.resourceId?.name || item.resourceId || '-'}</td>
                    <td>{item.technicianRemarks || '-'}</td>
                    <td>
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

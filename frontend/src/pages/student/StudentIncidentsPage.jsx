import { useEffect, useState } from 'react'
import { createIncident, getMyIncidents } from '../../api/incidentApi.js'
import '../../styles/IncidentPage.css'

export default function StudentIncidentsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [incidents, setIncidents] = useState([])

  const pendingCount = incidents.filter((item) => item.status === 'Pending').length
  const inProgressCount = incidents.filter((item) => item.status === 'In Progress').length
  const resolvedCount = incidents.filter((item) => item.status === 'Resolved').length

  function statusClass(status) {
    if (status === 'Resolved') return 'inc-status resolved'
    if (status === 'In Progress') return 'inc-status progress'
    return 'inc-status pending'
  }

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
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await createIncident({
        title: title.trim(),
        description: description.trim(),
        resourceId: resourceId.trim(),
        file,
      })
      setTitle('')
      setDescription('')
      setResourceId('')
      setFile(null)
      setMessage('Incident submitted successfully.')
      await loadMyIncidents()
    } catch (err) {
      setError(err.message || 'Could not submit incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="incident-page">
      <section className="dash-card inc-hero">
        <div>
          <h2>Incident Center</h2>
          <p>Submit issues quickly and track technician progress in real time.</p>
        </div>
        <div className="inc-stats">
          <div className="inc-stat">
            <span>Total</span>
            <strong>{incidents.length}</strong>
          </div>
          <div className="inc-stat">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="inc-stat">
            <span>In Progress</span>
            <strong>{inProgressCount}</strong>
          </div>
          <div className="inc-stat">
            <span>Resolved</span>
            <strong>{resolvedCount}</strong>
          </div>
        </div>
      </section>

      <section className="dash-card inc-form-card">
        <div className="inc-section-head">
          <h3>Report New Incident</h3>
          <p>Add clear details so technicians can resolve it faster.</p>
        </div>

        {message ? <div className="dash-msg success">{message}</div> : null}
        {error ? <div className="dash-msg error">{error}</div> : null}

        <form className="dash-form-grid inc-form-grid" onSubmit={handleSubmit}>
          <div className="inc-field">
            <label htmlFor="incident-title">Title</label>
            <input
              id="incident-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Projector not working in hall"
              required
            />
          </div>

          <div className="inc-field">
            <label htmlFor="incident-description">Description</label>
            <textarea
              id="incident-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened and when it was observed."
              required
            />
          </div>

          <div className="inc-field">
            <label htmlFor="incident-resource">Resource ID</label>
            <input
              id="incident-resource"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder="e.g. res-lha"
              required
            />
          </div>

          <div className="inc-field">
            <label htmlFor="incident-file">Attachment (optional)</label>
            <input
              id="incident-file"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button className="inc-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Incident'}
          </button>
        </form>
      </section>

      <section className="dash-card inc-list-card">
        <div className="inc-section-head">
          <h3>My Incidents</h3>
          <p>Latest first. Check current status and technician remarks.</p>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table inc-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Resource</th>
                <th>Remarks</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="inc-empty">
                    No incidents yet.
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
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
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

import { useEffect, useState } from 'react'
import { createIncident, getMyIncidents } from '../../api/incidentApi.js'

export default function StudentIncidentsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [incidents, setIncidents] = useState([])

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
    <>
      <section className="dash-card">
        <h2>Report Incident</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Create and track incidents related to resources.
        </p>
      </section>

      <section className="dash-card">
        {message ? <div className="dash-msg success">{message}</div> : null}
        {error ? <div className="dash-msg error">{error}</div> : null}

        <form className="dash-form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="incident-title">Title</label>
            <input
              id="incident-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="incident-description">Description</label>
            <textarea
              id="incident-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                maxWidth: 500,
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
          </div>
          <div>
            <label htmlFor="incident-resource">Resource ID</label>
            <input
              id="incident-resource"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder="e.g. res-lha"
              required
            />
          </div>
          <div>
            <label htmlFor="incident-file">Attachment (optional)</label>
            <input
              id="incident-file"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Incident'}
          </button>
        </form>
      </section>

      <section className="dash-card">
        <h2>My Incidents</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Resource</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={4}>No incidents yet.</td>
                </tr>
              ) : (
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.status}</td>
                    <td>{item.resourceId?.name || item.resourceId || '-'}</td>
                    <td>{item.technicianRemarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

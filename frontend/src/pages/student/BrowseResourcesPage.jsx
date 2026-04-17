import { useEffect, useState } from 'react'
import { fetchResources } from '../../api/resourceApi.js'
import './BrowseResourcesPage.css'

function normalizeResources(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}

function formatType(type) {
  return typeof type === 'string' ? type.replace(/_/g, ' ') : 'N/A'
}

function formatStatus(status) {
  return typeof status === 'string' ? status.replace(/_/g, ' ') : 'UNKNOWN'
}

function statusClass(status) {
  return typeof status === 'string' ? status.toLowerCase() : 'unknown'
}

function formatAvailabilityWindows(availabilityWindows) {
  if (!Array.isArray(availabilityWindows) || availabilityWindows.length === 0) return []
  return availabilityWindows.filter((window) => typeof window === 'string' && window.trim() !== '')
}

export default function BrowseResourcesPage() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadActiveResources() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchResources({ status: 'ACTIVE' })
        const normalized = normalizeResources(data).filter((resource) => resource?.id)
        if (!cancelled) setResources(normalized)
      } catch (err) {
        if (!cancelled) {
          setResources([])
          setError(err?.message || 'Failed to load resources')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadActiveResources()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="dash-card">
        <h2>Browse Resources</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Only active resources are shown for booking.
        </p>
      </section>

      <section className="dash-card">
        {loading ? (
          <p>Loading active resources...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : resources.length === 0 ? (
          <div className="student-resources-empty-state">
            No active resources are available right now.
          </div>
        ) : (
          <div className="student-resources-cards-grid">
            {resources.map((resource) => (
              <article key={resource.id} className="student-resource-card">
                <div className="student-resource-card-image-wrap">
                  <img
                    src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                    alt={resource.name || 'Resource image'}
                    className="student-resource-thumbnail"
                  />
                  <span className={`student-status-badge ${statusClass(resource.status)}`}>
                    {formatStatus(resource.status)}
                  </span>
                </div>
                <div className="student-resource-card-body">
                  <h3 className="student-resource-card-title">
                    {resource.name || 'Untitled Resource'}
                  </h3>
                  <p className="student-resource-card-type">{formatType(resource.type)}</p>
                  <div className="student-resource-card-details">
                    <div className="student-resource-card-detail">
                      <span>Capacity</span>
                      <strong>{resource.capacity ?? 'N/A'}</strong>
                    </div>
                    <div className="student-resource-card-detail">
                      <span>Location</span>
                      <strong>{resource.location || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="student-resource-card-availability">
                    <span className="student-availability-label">Availability</span>
                    {formatAvailabilityWindows(resource.availabilityWindows).length > 0 ? (
                      <div className="student-availability-chips">
                        {formatAvailabilityWindows(resource.availabilityWindows).map((window, idx) => (
                          <span key={`${resource.id}-availability-${idx}`} className="student-availability-chip">
                            {window}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="student-availability-empty">No availability windows set</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

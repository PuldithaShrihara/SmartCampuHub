import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchResources } from '../../api/resourceApi.js'
import './BookingGridViewPage.css'

function normalizeResources(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}

function getBlockName(resource) {
  const name = String(resource?.name || '').toUpperCase()
  const location = String(resource?.location || '').toUpperCase()
  const combined = `${name} ${location}`
  const blockWordMatch = combined.match(/\b([A-Z])\s*BLOCK\b/)
  if (blockWordMatch) return `${blockWordMatch[1]} Block`
  const codeMatch =
    name.match(/\b([A-Z])[-_]/) ||
    location.match(/\b([A-Z])[-_]/) ||
    location.match(/^\s*([A-Z])\d+/) ||
    name.match(/^\s*([A-Z])\d+/)
  if (codeMatch) return `${codeMatch[1]} Block`
  return 'Other Block'
}

function getNumericOrder(resource) {
  const name = String(resource?.name || '')
  const match = name.match(/\d+/)
  if (match) return Number(match[0])
  return Number.MAX_SAFE_INTEGER
}

function formatType(type) {
  return type === 'LAB' ? 'Lab' : type === 'LECTURE_HALL' ? 'Lecture Hall' : 'Resource'
}

function formatAvailability(availabilityWindows) {
  if (!Array.isArray(availabilityWindows) || availabilityWindows.length === 0) return 'Not specified'
  return availabilityWindows.filter(Boolean).join(', ')
}

function getGBlockRow(resource) {
  const location = String(resource?.location || '').toUpperCase().trim()
  if (/^G1\d{2}$/.test(location)) return 1
  if (/^G2\d{2}$/.test(location)) return 2
  return 0
}

function getFBlockRow(resource) {
  const location = String(resource?.location || '').toUpperCase().trim()
  if (/^F1\d{2}$/.test(location)) return 1
  if (/^F2\d{2}$/.test(location)) return 2
  return 0
}

function sortByLocationCode(a, b) {
  const na = parseInt(String(a?.location || '').replace(/\D/g, ''), 10) || 0
  const nb = parseInt(String(b?.location || '').replace(/\D/g, ''), 10) || 0
  if (na !== nb) return na - nb
  return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { numeric: true })
}

export default function BookingGridViewPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('SPACE')

  useEffect(() => {
    let cancelled = false

    async function loadGridResources() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchResources({ status: 'ACTIVE' })
        const normalized = normalizeResources(data).filter((resource) => {
          const type = String(resource?.type || '').toUpperCase()
          return resource?.id && (type === 'LAB' || type === 'LECTURE_HALL' || type === 'EQUIPMENT')
        })

        if (!cancelled) setResources(normalized)
      } catch (err) {
        if (!cancelled) {
          setResources([])
          setError(err?.message || 'Failed to load booking grid resources')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGridResources()
    return () => {
      cancelled = true
    }
  }, [])

  const groupedByBlock = useMemo(() => {
    const map = {}
    resources
      .filter((resource) => {
        const type = String(resource?.type || '').toUpperCase()
        return type === 'LAB' || type === 'LECTURE_HALL'
      })
      .forEach((resource) => {
      const block = getBlockName(resource)
      if (!map[block]) map[block] = []
      map[block].push(resource)
      })
    Object.keys(map).forEach((block) => {
      map[block].sort((a, b) => {
        const numericDiff = getNumericOrder(a) - getNumericOrder(b)
        if (numericDiff !== 0) return numericDiff
        return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      })
    })
    return map
  }, [resources])

  const blockNames = useMemo(() => {
    const all = Object.keys(groupedByBlock)
    const priority = ['G Block', 'F Block']
    const prioritized = priority.filter((name) => all.includes(name))
    const others = all
      .filter((name) => !priority.includes(name))
      .sort((a, b) => a.localeCompare(b))
    return [...prioritized, ...others]
  }, [groupedByBlock])

  const equipmentResources = useMemo(() => {
    return resources
      .filter((resource) => String(resource?.type || '').toUpperCase() === 'EQUIPMENT')
      .sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
          sensitivity: 'base',
          numeric: true,
        }),
      )
  }, [resources])

  return (
    <>
      <section className="dash-card">
        <h2>Booking Grid View</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {viewMode === 'SPACE'
            ? 'Active labs and lecture halls sorted by room number.'
            : 'Active equipment with images and quick booking.'}
        </p>
        <div className="booking-grid-top-actions">
          <button
            type="button"
            className={`booking-grid-view-btn ${viewMode === 'SPACE' ? 'active' : ''}`}
            onClick={() => setViewMode('SPACE')}
          >
            Labs / Lecture Halls
          </button>
          <button
            type="button"
            className={`booking-grid-equipment-btn ${viewMode === 'EQUIPMENT' ? 'active' : ''}`}
            onClick={() => setViewMode('EQUIPMENT')}
          >
            Equipments
          </button>
        </div>
      </section>

      <section className="dash-card">
        {loading ? (
          <p>Loading resources...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : viewMode === 'SPACE' && blockNames.length === 0 ? (
          <div className="booking-grid-empty-state">
            No active labs or lecture halls are available right now.
          </div>
        ) : viewMode === 'EQUIPMENT' && equipmentResources.length === 0 ? (
          <div className="booking-grid-empty-state">
            No active equipment is available right now.
          </div>
        ) : viewMode === 'EQUIPMENT' ? (
          <div className="booking-grid-equipment-grid">
            {equipmentResources.map((resource) => (
              <article key={resource.id} className="booking-grid-room-tile equipment-tile">
                <img
                  src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                  alt={resource.name || 'Resource image'}
                  className="booking-grid-room-image"
                />
                <h3>{resource.name || 'Unnamed Equipment'}</h3>
                <p>{formatType(resource.type)}</p>
                <div className="booking-grid-room-meta">
                  <span>Location: {resource.location || 'N/A'}</span>
                  <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                </div>
                <button
                  type="button"
                  className="booking-grid-book-btn"
                  onClick={() =>
                    navigate('/student/bookings/create', {
                      state: {
                        initialCategory: 'EQUIPMENT',
                        preselectedResourceId: resource.id,
                      },
                    })
                  }
                >
                  Book
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="booking-grid-board">
            {blockNames.map((blockName) => (
              <section
                key={blockName}
                className={`booking-grid-block-section ${blockName === 'F Block' ? 'f-block' : 'g-block'}`}
              >
                <header className="booking-grid-block-header">{blockName.toUpperCase()}</header>
                {blockName === 'G Block' ? (
                  <div className="booking-grid-g-rows">
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getGBlockRow(resource) === 1)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getGBlockRow(resource) === 2)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getGBlockRow(resource) === 0)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                  </div>
                ) : blockName === 'F Block' ? (
                  <div className="booking-grid-g-rows">
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getFBlockRow(resource) === 1)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getFBlockRow(resource) === 2)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                    <div className="booking-grid-room-grid">
                      {groupedByBlock[blockName]
                        .filter((resource) => getFBlockRow(resource) === 0)
                        .sort(sortByLocationCode)
                        .map((resource) => (
                          <article key={resource.id} className="booking-grid-room-tile">
                            <img
                              src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                              alt={resource.name || 'Resource image'}
                              className="booking-grid-room-image"
                            />
                            <h3>{resource.name || 'Unnamed Resource'}</h3>
                            <p>{formatType(resource.type)}</p>
                            <div className="booking-grid-room-meta">
                              <span>Location: {resource.location || 'N/A'}</span>
                              <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                            </div>
                            <button
                              type="button"
                              className="booking-grid-book-btn"
                              onClick={() =>
                                navigate('/student/bookings/create', {
                                  state: {
                                    initialCategory: 'SPACE',
                                    preselectedResourceId: resource.id,
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          </article>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="booking-grid-room-grid">
                    {groupedByBlock[blockName].map((resource) => (
                      <article key={resource.id} className="booking-grid-room-tile">
                        <img
                          src={resource.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                          alt={resource.name || 'Resource image'}
                          className="booking-grid-room-image"
                        />
                        <h3>{resource.name || 'Unnamed Resource'}</h3>
                        <p>{formatType(resource.type)}</p>
                        <div className="booking-grid-room-meta">
                          <span>Location: {resource.location || 'N/A'}</span>
                          <span>Available: {formatAvailability(resource.availabilityWindows)}</span>
                        </div>
                        <button
                          type="button"
                          className="booking-grid-book-btn"
                          onClick={() =>
                            navigate('/student/bookings/create', {
                              state: {
                                initialCategory: 'SPACE',
                                preselectedResourceId: resource.id,
                              },
                            })
                          }
                        >
                          Book
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

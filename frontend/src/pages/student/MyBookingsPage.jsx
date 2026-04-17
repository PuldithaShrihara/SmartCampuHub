import { useState, useEffect } from 'react'
import BookingCategorySelector from '../../components/booking/BookingCategorySelector.jsx'
import CreateSpaceBookingForm from '../../components/booking/CreateSpaceBookingForm.jsx'
import CreateEquipmentBookingForm from '../../components/booking/CreateEquipmentBookingForm.jsx'
import Modal from '../../components/common/Modal.jsx'
import { createEquipmentBooking, createSpaceBooking, getMyBookings } from '../../api/bookingApi.js'
import { fetchActiveResourcesByCategory } from '../../api/resourceApi.js'

export default function MyBookingsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [bookingCategory, setBookingCategory] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [activeTab, setActiveTab] = useState('ALL')

  async function fetchBookings() {
    try {
      setLoading(true)
      const data = await getMyBookings()
      setBookings(data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (!showCreateForm || !bookingCategory) return

    let cancelled = false
    async function loadResourcesForBooking() {
      setResourcesLoading(true)
      setResourcesError('')
      try {
        const data = await fetchActiveResourcesByCategory(bookingCategory)
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : []
        if (!cancelled) {
          setResources(normalized.filter((resource) => resource && resource.id))
        }
      } catch (err) {
        if (!cancelled) {
          setResources([])
          setResourcesError(err?.message || 'Failed to load resources')
        }
      } finally {
        if (!cancelled) setResourcesLoading(false)
      }
    }

    loadResourcesForBooking()
    return () => {
      cancelled = true
    }
  }, [showCreateForm, bookingCategory])

  async function handleSpaceSubmit(data) {
    try {
      setSubmittingBooking(true)
      await createSpaceBooking(data)
      alert('Space booking submitted successfully!')
      closeCreateModal()
      fetchBookings()
    } catch (err) {
      alert('Failed to submit space booking: ' + err.message)
    } finally {
      setSubmittingBooking(false)
    }
  }

  async function handleEquipmentSubmit(data) {
    try {
      setSubmittingBooking(true)
      await createEquipmentBooking(data)
      alert('Equipment booking submitted successfully!')
      closeCreateModal()
      fetchBookings()
    } catch (err) {
      alert('Failed to submit equipment booking: ' + err.message)
    } finally {
      setSubmittingBooking(false)
    }
  }

  function closeCreateModal() {
    setShowCreateForm(false)
    setBookingCategory('')
    setResources([])
    setResourcesError('')
    setResourcesLoading(false)
  }

  const equipmentBookings = bookings.filter((booking) => resolveBookingCategory(booking) === 'EQUIPMENT')
  const spaceBookings = bookings.filter((booking) => resolveBookingCategory(booking) === 'SPACE')
  const totalBookings = bookings.length
  const pendingCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'PENDING').length
  const approvedCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'APPROVED').length
  const rejectedCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'REJECTED').length
  const cancelledCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'CANCELLED').length

  function formatCell(value) {
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  }

  function formatTime(value) {
    if (!value || !/^\d{2}:\d{2}/.test(String(value))) return formatCell(value)
    const [hh, mm] = String(value).slice(0, 5).split(':').map(Number)
    const period = hh >= 12 ? 'PM' : 'AM'
    const hour12 = hh % 12 || 12
    return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`
  }

  return (
    <>
      <section className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
          <div>
            <h2>My Bookings</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Review all your booking requests and track their approval status.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="dash-btn"
            >
              + Create Booking
            </button>
          </div>
        </div>

        <Modal
          isOpen={showCreateForm}
          onClose={closeCreateModal}
          title="Create New Booking"
        >
          {!bookingCategory ? (
            <BookingCategorySelector onSelect={setBookingCategory} disabled={submittingBooking} />
          ) : (
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="dash-badge badge-pending">
                {bookingCategory === 'SPACE' ? 'Labs / Lectures' : 'Equipments'}
              </span>
              <button
                type="button"
                className="dash-btn-outline"
                onClick={() => setBookingCategory('')}
                disabled={submittingBooking || resourcesLoading}
              >
                Change Type
              </button>
            </div>
          )}

          {bookingCategory && resourcesLoading ? (
            <p>Loading available resources...</p>
          ) : bookingCategory && resourcesError ? (
            <div className="dash-msg error">{resourcesError}</div>
          ) : bookingCategory && resources.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              No active {bookingCategory === 'SPACE' ? 'space resources' : 'equipment resources'} are available.
            </p>
          ) : bookingCategory === 'SPACE' ? (
            <CreateSpaceBookingForm onSubmit={handleSpaceSubmit} resources={resources} submitting={submittingBooking} />
          ) : bookingCategory === 'EQUIPMENT' ? (
            <CreateEquipmentBookingForm onSubmit={handleEquipmentSubmit} resources={resources} submitting={submittingBooking} />
          ) : null}
        </Modal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginTop: 8,
          }}
        >
          <StatCard title="Total Bookings" value={totalBookings} bg="#f1f5ff" />
          <StatCard title="Pending" value={pendingCount} bg="#fff8e8" />
          <StatCard title="Approved" value={approvedCount} bg="#ebfdf7" />
          <StatCard title="Rejected" value={rejectedCount} bg="#fff1f1" />
          <StatCard title="Cancelled" value={cancelledCount} bg="#f3f4f6" />
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 20, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          {[
            { id: 'ALL', label: 'All Bookings' },
            { id: 'EQUIPMENT', label: 'Equipment Bookings' },
            { id: 'SPACE', label: 'Labs / Lecture Halls Bookings' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                paddingBottom: 8,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'ALL' || activeTab === 'SPACE') && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Labs / Lecture Halls Bookings</h3>
            {loading ? (
              <p>Loading bookings...</p>
            ) : error ? (
              <div className="dash-msg error">
                Failed to load bookings: {error}. Please ensure the backend server is running.
              </div>
            ) : spaceBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12 }}>
                No labs/lectures bookings to show yet.
              </p>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Resource Name</th>
                      <th>Resource Type</th>
                      <th>Location</th>
                      <th>Username</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Attendees</th>
                      <th>Purpose</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spaceBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{formatCell(b.resourceName)}</td>
                        <td>{formatCell(String(b.resourceType || 'UNKNOWN').replace(/_/g, ' '))}</td>
                        <td>{formatCell(b.resourceLocation)}</td>
                        <td>{formatCell(b.userName)}</td>
                        <td>{formatCell(b.bookingDate)}</td>
                        <td>{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
                        <td>{formatCell(b.expectedAttendees)}</td>
                        <td>{formatCell(b.purpose)}</td>
                        <td>
                          <span className={`dash-badge badge-${normalizeStatus(b.status).toLowerCase()}`}>
                            {formatCell(normalizeStatus(b.status))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'ALL' || activeTab === 'EQUIPMENT') && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Equipment Bookings</h3>
            {loading ? (
              <p>Loading bookings...</p>
            ) : error ? (
              <div className="dash-msg error">
                Failed to load bookings: {error}. Please ensure the backend server is running.
              </div>
            ) : equipmentBookings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12 }}>
                <p style={{ marginBottom: 8 }}>No equipment bookings yet</p>
                <button type="button" className="dash-btn-outline" onClick={() => setShowCreateForm(true)}>
                  Book Equipment
                </button>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Resource Name</th>
                      <th>Resource Type</th>
                      <th>Location</th>
                      <th>Username</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Attendees</th>
                      <th>Purpose</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{formatCell(b.resourceName)}</td>
                        <td>{formatCell(String(b.resourceType || 'UNKNOWN').replace(/_/g, ' '))}</td>
                        <td>{formatCell(b.resourceLocation)}</td>
                        <td>{formatCell(b.userName)}</td>
                        <td>{formatCell(b.bookingDate)}</td>
                        <td>{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
                        <td>{formatCell(b.quantityRequested)}</td>
                        <td>{formatCell(b.purpose)}</td>
                        <td>
                          <span className={`dash-badge badge-${normalizeStatus(b.status).toLowerCase()}`}>
                            {formatCell(normalizeStatus(b.status))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}

function normalizeStatus(value) {
  return String(value || 'PENDING').trim().toUpperCase()
}

function resolveBookingCategory(booking) {
  const bookingType = String(booking?.bookingType || '').trim().toUpperCase()
  const resourceCategory = String(booking?.resourceCategory || '').trim().toUpperCase()
  const resourceType = String(booking?.resourceType || '').trim().toUpperCase()

  if (bookingType === 'EQUIPMENT' || resourceCategory === 'EQUIPMENT' || resourceType === 'EQUIPMENT') {
    return 'EQUIPMENT'
  }

  // Treat all other valid/legacy values as space-style bookings so rows are never hidden.
  return 'SPACE'
}

function StatCard({ title, value, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
    </div>
  )
}

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

  return (
    <>
      <section className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2>My Bookings</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Review all your booking requests and track their approval status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="dash-btn"
          >
            + Create Booking
          </button>
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

        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Requests</h3>
          {loading ? (
            <p>Loading bookings...</p>
          ) : error ? (
            <div className="dash-msg error">
              Failed to load bookings: {error}. Please ensure the backend server is running.
            </div>
          ) : bookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12 }}>
              No bookings to show yet. Create a booking to see it listed here.
            </p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="res-name">{b.resourceName || 'Unknown Resource'}</div>
                        <div className="res-id">{b.resourceId}</div>
                      </td>
                      <td>{String(b.resourceType || 'UNKNOWN').replace(/_/g, ' ')}</td>
                      <td>{b.bookingDate}</td>
                      <td>{b.startTime} - {b.endTime}</td>
                      <td>
                        <span className={`dash-badge badge-${b.status?.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

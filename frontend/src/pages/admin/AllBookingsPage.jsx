import { useEffect, useState } from 'react'
import { deleteBooking, getAllBookings, updateBookingStatus } from '../../api/bookingApi.js'

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [actionError, setActionError] = useState('')

  async function loadBookings() {
    try {
      setLoading(true)
      const data = await getAllBookings()
      setBookings(data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  async function handleStatusUpdate(bookingId, nextStatus) {
    try {
      setUpdatingId(bookingId)
      setActionError('')
      let rejectionReason = ''
      if (nextStatus === 'REJECTED') {
        rejectionReason = window.prompt('Enter rejection reason:', 'Rejected by admin') || ''
      }
      const updated = await updateBookingStatus(bookingId, nextStatus, rejectionReason)
      setBookings((prev) => prev.map((item) => (item.id === bookingId ? updated : item)))
      return true
    } catch (err) {
      const message = err.message || 'Failed to update booking status'
      setActionError(message)
      window.alert(message)
      return false
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDeleteBooking(bookingId) {
    const confirmed = window.confirm('Are you sure you want to delete this booking?')
    if (!confirmed) return

    try {
      setUpdatingId(bookingId)
      setActionError('')
      await deleteBooking(bookingId)
      setBookings((prev) => prev.filter((item) => item.id !== bookingId))
    } catch (err) {
      const message = err.message || 'Failed to delete booking'
      setActionError(message)
      window.alert(message)
    } finally {
      setUpdatingId(null)
    }
  }

  function handleEditClick(booking) {
    setActionError('')
    setEditingId(booking.id)
    setSelectedStatus(booking.status || 'PENDING')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setSelectedStatus('PENDING')
  }

  async function handleSaveEdit(bookingId) {
    const ok = await handleStatusUpdate(bookingId, selectedStatus)
    if (ok) {
      setEditingId(null)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredBookings = bookings.filter((booking) => {
    if (!normalizedSearch) return true

    const haystack = [
      booking.userName,
      booking.userId,
      booking.resourceName,
      booking.resourceId,
      booking.status,
      booking.bookingDate,
      booking.startTime,
      booking.endTime,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  return (
      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Booking Records</h3>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, resource, date, or status..."
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: '#fff',
            }}
          />
        </div>
        {actionError && <div className="dash-msg error">{actionError}</div>}
        {loading ? (
          <p>Loading bookings...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : filteredBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No bookings found.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Resource</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="res-name">{b.userName}</div>
                      <div className="res-id">{b.userId}</div>
                    </td>
                    <td>
                      <div className="res-name">{b.resourceName || 'Unknown Resource'}</div>
                      <div className="res-id">{b.resourceId}</div>
                    </td>
                    <td>
                      <div>{b.bookingDate}</div>
                      <div className="res-id">{b.startTime} - {b.endTime}</div>
                    </td>
                    <td>
                      {editingId === b.id ? (
                        <select
                          className="dash-inline-select"
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          disabled={updatingId === b.id}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <span className={`dash-badge badge-${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === b.id ? (
                        <div className="dash-actions-inline">
                          <button
                            type="button"
                            className="dash-btn-outline"
                            disabled={updatingId === b.id}
                            onClick={() => handleSaveEdit(b.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="dash-btn-outline"
                            disabled={updatingId === b.id}
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="dash-actions-inline">
                          <button
                            type="button"
                            className="dash-btn-outline"
                            disabled={updatingId === b.id}
                            onClick={() => handleEditClick(b)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="dash-btn-outline"
                            disabled={updatingId === b.id}
                            onClick={() => handleDeleteBooking(b.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
  )
}


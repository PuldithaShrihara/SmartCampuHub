import { useEffect, useState } from 'react'
import { deleteBooking, getAllBookings, updateBookingStatus } from '../../api/bookingApi.js'
import { useToast } from '../../components/toastContext.js'
import '../student/MyBookingsPage.css'
import './AllBookingsPage.css'

export default function AllBookingsPage() {
  const { pushToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('ALL')
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
      await updateBookingStatus(bookingId, nextStatus, rejectionReason)
      await loadBookings()
      if (nextStatus === 'APPROVED') {
        pushToast({ type: 'success', message: 'Booking approved successfully' })
      } else if (nextStatus === 'REJECTED') {
        pushToast({ type: 'success', message: 'Booking rejected successfully' })
      } else {
        pushToast({ type: 'success', message: 'Booking status updated successfully' })
      }
      return true
    } catch (err) {
      const message = err.message || 'Failed to update booking status'
      setActionError(message)
      pushToast({ type: 'error', message: 'Failed to update booking status' })
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
      pushToast({ type: 'error', message })
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

  const filteredBookings = filterBookings(bookings, statusFilter)
  const equipmentBookings = filteredBookings.filter((booking) => resolveBookingCategory(booking) === 'EQUIPMENT')
  const spaceBookings = filteredBookings.filter((booking) => resolveBookingCategory(booking) === 'SPACE')

  const totalBookings = bookings.length
  const pendingCount = bookings.filter((b) => normalizeStatus(b.status) === 'PENDING').length
  const approvedCount = bookings.filter((b) => normalizeStatus(b.status) === 'APPROVED').length
  const checkedInCount = bookings.filter((b) => normalizeStatus(b.status) === 'CHECKED_IN').length
  const rejectedCount = bookings.filter((b) => normalizeStatus(b.status) === 'REJECTED').length
  const cancelledCount = bookings.filter((b) => normalizeStatus(b.status) === 'CANCELLED').length

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

  function renderStatusCell(b) {
    if (editingId === b.id) {
      return (
        <select
          className="dash-inline-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={updatingId === b.id}
        >
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CHECKED_IN">CHECKED_IN</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      )
    }
    return (
      <span className={`dash-badge badge-${normalizeStatus(b.status).toLowerCase()}`}>
        {formatCell(normalizeStatus(b.status))}
      </span>
    )
  }

  function renderActionsCell(b) {
    return (
      <td className="no-print">
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
    )
  }

  function handleDownloadPdf() {
    try {
      window.print()
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Failed to open print dialog.' })
    }
  }

  return (
    <section className="dash-card bookings-shell">
      <style>{`
          @media print {
            .no-print,
            .sidebar,
            .app-header,
            .header-profile-wrap,
            .dashboard-container .sidebar,
            .dashboard-main .app-header {
              display: none !important;
            }

            .dashboard-main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }

            .dashboard-content {
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }

            .dash-card {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            body {
              background: #fff !important;
            }
          }
        `}</style>

      <div className="bookings-header all-bookings-header">
        <div className="bookings-header-copy">
          <h2>All Bookings</h2>
          <p className="bookings-header-subtitle">
            Review and manage all booking requests across the campus.
          </p>
        </div>
        <div className="no-print bookings-header-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="all-bookings-filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            type="button"
            className="dash-btn-outline"
            onClick={handleDownloadPdf}
            disabled={filteredBookings.length === 0}
          >
            Download PDF
          </button>
        </div>
      </div>

      {actionError && <div className="dash-msg error">{actionError}</div>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : error ? (
        <div className="dash-msg error">{error}</div>
      ) : (
        <>
          <div className="bookings-stat-grid">
            <StatCard title="Total Bookings" value={totalBookings} tone="total" />
            <StatCard title="Pending" value={pendingCount} tone="pending" />
            <StatCard title="Approved" value={approvedCount} tone="approved" />
            <StatCard title="Checked In" value={checkedInCount} tone="approved" />
            <StatCard title="Rejected" value={rejectedCount} tone="rejected" />
            <StatCard title="Cancelled" value={cancelledCount} tone="cancelled" />
          </div>

          <div className="bookings-tabs">
            {[
              { id: 'ALL', label: 'All Bookings' },
              { id: 'EQUIPMENT', label: 'Equipment Bookings' },
              { id: 'SPACE', label: 'Labs / Lecture Halls Bookings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`bookings-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(activeTab === 'ALL' || activeTab === 'SPACE') && (
            <div className="bookings-table-section">
              <h3 className="bookings-table-title">Labs / Lecture Halls Bookings</h3>
              {spaceBookings.length === 0 ? (
                <p className="bookings-empty">
                  No labs/lectures bookings to show{statusFilter !== 'ALL' ? ' for this filter' : ''}.
                </p>
              ) : (
                <div className="dash-table-wrap bookings-table-wrap">
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
                        <th className="no-print">Actions</th>
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
                          <td>
                            {formatTime(b.startTime)} - {formatTime(b.endTime)}
                          </td>
                          <td>{formatCell(b.expectedAttendees)}</td>
                          <td>{formatCell(b.purpose)}</td>
                          <td>{renderStatusCell(b)}</td>
                          {renderActionsCell(b)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'ALL' || activeTab === 'EQUIPMENT') && (
            <div className="bookings-table-section">
              <h3 className="bookings-table-title">Equipment Bookings</h3>
              {equipmentBookings.length === 0 ? (
                <div className="bookings-empty">
                  <p className="all-bookings-empty-caption">No equipment bookings yet{statusFilter !== 'ALL' ? ' for this filter' : ''}.</p>
                </div>
              ) : (
                <div className="dash-table-wrap bookings-table-wrap">
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
                        <th className="no-print">Actions</th>
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
                          <td>
                            {formatTime(b.startTime)} - {formatTime(b.endTime)}
                          </td>
                          <td>{formatCell(b.quantityRequested)}</td>
                          <td>{formatCell(b.purpose)}</td>
                          <td>{renderStatusCell(b)}</td>
                          {renderActionsCell(b)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function filterBookings(bookings, statusFilter) {
  const normalizedStatus = (statusFilter || 'ALL').trim().toUpperCase()

  return bookings.filter((booking) => {
    if (normalizedStatus !== 'ALL') {
      if ((booking.status || '').trim().toUpperCase() !== normalizedStatus) return false
    }
    return true
  })
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

  return 'SPACE'
}

function StatCard({ title, value, tone }) {
  return (
    <div className={`booking-stat-card ${tone || ''}`}>
      <div className="booking-stat-title">{title}</div>
      <div className="booking-stat-value">{String(value).padStart(2, '0')}</div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingCategorySelector from '../../components/booking/BookingCategorySelector.jsx'
import CreateSpaceBookingForm from '../../components/booking/CreateSpaceBookingForm.jsx'
import CreateEquipmentBookingForm from '../../components/booking/CreateEquipmentBookingForm.jsx'
import { createEquipmentBooking, createSpaceBooking } from '../../api/bookingApi.js'
import { fetchActiveResourcesByCategory } from '../../api/resourceApi.js'
import { useToast } from '../../components/toastContext.js'

export default function CreateBookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const preselectedResourceId = String(location.state?.preselectedResourceId || '').trim()
  const { pushToast } = useToast()
  const [bookingCategory, setBookingCategory] = useState('')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const initialCategory = String(location.state?.initialCategory || '').toUpperCase()
    if (initialCategory === 'SPACE' || initialCategory === 'EQUIPMENT') {
      setBookingCategory(initialCategory)
    }
  }, [location.state])

  useEffect(() => {
    if (!bookingCategory) {
      setResources([])
      setError('')
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadResources() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchActiveResourcesByCategory(bookingCategory)
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : []
        if (!cancelled) {
          setResources(normalized.filter((r) => r && r.id))
        }
      } catch (err) {
        if (!cancelled) {
          setResources([])
          setError(err?.message || 'Failed to load resources')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadResources()
    return () => {
      cancelled = true
    }
  }, [bookingCategory])

  async function handleCreateSpaceBooking(payload) {
    try {
      setSubmitting(true)
      await createSpaceBooking(payload)
      pushToast({ type: 'success', message: 'Space booking request created successfully.' })
      navigate('/student/bookings', { replace: true })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Failed to create space booking.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateEquipmentBooking(payload) {
    try {
      setSubmitting(true)
      await createEquipmentBooking(payload)
      pushToast({ type: 'success', message: 'Equipment booking request created successfully.' })
      navigate('/student/bookings', { replace: true })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Failed to create equipment booking.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleBack() {
    navigate(-1)
  }

  return (
    <>
      <section className="dash-card">
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="dash-btn-outline"
            onClick={handleBack}
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>
        <h2 style={{ marginTop: 0 }}>Create Booking</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Submit bookings only for resources created by admins.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Create Booking</h3>

        {!bookingCategory ? (
          <BookingCategorySelector onSelect={setBookingCategory} />
        ) : (
          <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="dash-badge badge-pending">
              {bookingCategory === 'SPACE' ? 'Labs / Lectures' : 'Equipments'}
            </span>
            <button type="button" className="dash-btn-outline" onClick={() => setBookingCategory('')} disabled={submitting || loading}>
              Change Type
            </button>
          </div>
        )}

        {bookingCategory && loading ? (
          <p>Loading available resources...</p>
        ) : bookingCategory && error ? (
          <div className="dash-msg error">{error}</div>
        ) : bookingCategory && resources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No active {bookingCategory === 'SPACE' ? 'space resources' : 'equipment resources'} are available right now.
          </p>
        ) : bookingCategory === 'SPACE' ? (
          <CreateSpaceBookingForm
            key={preselectedResourceId || 'space-booking'}
            resources={resources}
            submitting={submitting}
            onSubmit={handleCreateSpaceBooking}
            initialResourceId={preselectedResourceId}
          />
        ) : bookingCategory === 'EQUIPMENT' ? (
          <CreateEquipmentBookingForm resources={resources} submitting={submitting} onSubmit={handleCreateEquipmentBooking} />
        ) : null}
      </section>
    </>
  )
}

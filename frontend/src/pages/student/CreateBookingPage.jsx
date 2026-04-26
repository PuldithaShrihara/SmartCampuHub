import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import BookingCategorySelector from '../../components/booking/BookingCategorySelector.jsx'
import CreateSpaceBookingForm from '../../components/booking/CreateSpaceBookingForm.jsx'
import CreateEquipmentBookingForm from '../../components/booking/CreateEquipmentBookingForm.jsx'
import { createEquipmentBooking, createSpaceBooking } from '../../api/bookingApi.js'
import { fetchActiveResourcesByCategory } from '../../api/resourceApi.js'
import { useAuth } from '../../context/useAuth.js'

export default function CreateBookingPage() {
  const location = useLocation()
  const preselectedResourceId = location.state?.preselectedResourceId
  const { preferences } = useAuth()
  const [bookingCategory, setBookingCategory] = useState('')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const initialCategory = String(location.state?.initialCategory || '').toUpperCase()
    if (initialCategory === 'SPACE' || initialCategory === 'EQUIPMENT') {
      setBookingCategory(initialCategory)
      return
    }
    const preferredCategory = String(preferences?.defaultResourceCategory || '').toUpperCase()
    if (preferredCategory === 'SPACE' || preferredCategory === 'EQUIPMENT') {
      setBookingCategory(preferredCategory)
    }
  }, [location.state, preferences?.defaultResourceCategory])

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
      window.alert('Space booking request created successfully.')
    } catch (err) {
      window.alert(err?.message || 'Failed to create space booking.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateEquipmentBooking(payload) {
    try {
      setSubmitting(true)
      await createEquipmentBooking(payload)
      window.alert('Equipment booking request created successfully.')
    } catch (err) {
      window.alert(err?.message || 'Failed to create equipment booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="dash-card">
        <h2>Create Booking</h2>
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
            resources={resources}
            submitting={submitting}
            onSubmit={handleCreateSpaceBooking}
            initialResourceId={preselectedResourceId}
          />
        ) : bookingCategory === 'EQUIPMENT' ? (
          <CreateEquipmentBookingForm
            resources={resources}
            submitting={submitting}
            onSubmit={handleCreateEquipmentBooking}
            initialResourceId={preselectedResourceId}
          />
        ) : null}
      </section>
    </>
  )
}
